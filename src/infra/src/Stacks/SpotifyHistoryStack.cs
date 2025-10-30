using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SSM;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Constructs;

namespace Music.Infra.Stacks;

/// <summary>
///     Defines the stack for the Spotify History Stack.
/// </summary>
/// <remarks>
///     This stack contains resources for recording Spotify listening history:
///     - Lambda function for fetching and storing song history
///     - DynamoDB table for persistent storage
///     - CloudWatch Event Rule for scheduled execution
///     - SSM Parameter for storing the last processed song ID
/// </remarks>
public sealed class SpotifyHistoryStack : Stack
{
    private readonly Table historyTable;
    private readonly Function updateHistoryJobLambda;

    internal SpotifyHistoryStack(Construct scope, string id, IStackProps? props = null,
        IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region DynamoDB Table

        historyTable = new Table(this, "SpotifyHistory", new TableProps
        {
            TableName = "SpotifyHistory",
            PartitionKey = new Attribute { Name = "entityType", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "processedTimestamp", Type = AttributeType.STRING },
            BillingMode = BillingMode.PAY_PER_REQUEST,
            PointInTimeRecoverySpecification = new PointInTimeRecoverySpecification
            {
                PointInTimeRecoveryEnabled = true
            }
        });

        #endregion

        #region SSM Parameters

        var lastProcessedSongIdParameter = new StringParameter(this, "LastProcessedSongId", new StringParameterProps
        {
            ParameterName = "/Music/SpotifyHistory/LastProcessedSongId",
            StringValue = "placeholder", // Initial placeholder value
            Description = "Stores the ID of the last processed song to enable deduplication"
        });

        var scheduleRateParameter = new StringParameter(this, "HistoryScheduleRate", new StringParameterProps
        {
            ParameterName = "/Music/SpotifyHistory/ScheduleRate",
            StringValue = "rate(5 minutes)", // Default value
            Description = "Schedule rate for Spotify History Lambda (using Schedule expression syntax)"
        });

        var songLimitParameter = new StringParameter(this, "SongLimit", new StringParameterProps
        {
            ParameterName = "/Music/SpotifyHistory/SongLimit",
            StringValue = "25", // Default value
            Description = "Number of songs to fetch from Spotify API"
        });

        // Store the table name in SSM Parameter Store instead of using CloudFormation exports
        var historyTableNameParameter = new StringParameter(this, "HistoryTableNameParameter", new StringParameterProps
        {
            ParameterName = "/Music/SpotifyHistory/TableName",
            StringValue = historyTable.TableName,
            Description = "Name of the DynamoDB table storing Spotify history"
        });

        #endregion

        #region Lambda Functions

        #region Update History Job Lambda

        // Create a custom role for the Lambda with specific permissions
        var updateHistoryJobLambdaRole = new Role(this, "UpdateSpotifyHistoryJobLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for Spotify History Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add permissions for DynamoDB and SSM
        updateHistoryJobLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "ssm:GetParameter",
                "ssm:PutParameter"
            ],
            Resources =
            [
                historyTable.TableArn,
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/SpotifyHistory/LastProcessedSongId",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/AdminPanel/Spotify/UserAccessToken",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/AdminPanel/Spotify/UserRefreshToken",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/SpotifyHistory/SongLimit"
            ]
        }));

        // Add Secrets Manager permissions for Spotify client secret
        updateHistoryJobLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [$"arn:aws:secretsmanager:{Region}:{Account}:secret:SpotifyClientSecret-*"]
        }));

        // Add CloudWatch permissions
        updateHistoryJobLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Use the NodejsLambdaFunction construct instead of directly creating a Function
        var updateHistoryJobLambdaConstruct = new NodejsLambdaFunction(this, "UpdateSpotifyHistoryJobLambda",
            new NodejsLambdaFunctionProps
            {
                Handler = "update-spotify-song-history.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/jobs"),
                Role = updateHistoryJobLambdaRole,
                Description = "Fetches and stores Spotify listening history",
                Environment = new Dictionary<string, string>
                {
                    ["DYNAMODB_TABLE_NAME"] = historyTable.TableName,
                    ["LAST_PROCESSED_SONG_PARAMETER"] = lastProcessedSongIdParameter.ParameterName,
                    ["SPOTIFY_ACCESS_TOKEN_PARAMETER"] = "/Music/AdminPanel/Spotify/UserAccessToken",
                    ["SPOTIFY_REFRESH_TOKEN_PARAMETER"] = "/Music/AdminPanel/Spotify/UserRefreshToken",
                    ["SPOTIFY_CLIENT_SECRET_NAME"] = "SpotifyClientSecret",
                    ["SPOTIFY_REDIRECT_URI"] =
                        "https://admin.music.mariolopez.org/api/nodejs/v1/spotify/oauth/callback",
                    ["SONG_LIMIT_PARAMETER"] = songLimitParameter.ParameterName
                }
            });

        // Get the Function from the construct
        updateHistoryJobLambda = updateHistoryJobLambdaConstruct.Function;

        #endregion

        #region Update Schedule Lambda

        var rule = new Rule(this, "UpdateSpotifyHistoryJobSchedule", new RuleProps
        {
            Schedule = Schedule.Expression(Token.AsString(scheduleRateParameter.StringValue)),
            Description = "Schedule for fetching Spotify history"
        });

        // Create a role for the update schedule Lambda
        var updateScheduleLambdaRole = new Role(this, "UpdateScheduleLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for Spotify History Schedule Update Lambda function",
            ManagedPolicies =
                [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Grant permissions to the Lambda to modify the rule and read SSM parameter
        updateScheduleLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["events:PutRule"],
            Resources = [rule.RuleArn]
        }));

        // Add SSM parameter read permission
        updateScheduleLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/SpotifyHistory/ScheduleRate"]
        }));

        var updateScheduleLambdaConstruct = new NodejsLambdaFunction(this, "UpdateScheduleLambda",
            new NodejsLambdaFunctionProps
            {
                Handler = "update-schedule.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/event-handlers"),
                Role = updateScheduleLambdaRole,
                Description = "Updates EventBridge rule schedule when SSM parameter changes",
                Environment = new Dictionary<string, string>
                {
                    ["RULE_NAME"] = rule.RuleName
                }
            });

        var updateScheduleLambda = updateScheduleLambdaConstruct.Function;

        // Create EventBridge rule to trigger Lambda when parameter changes
        var scheduleParameterChangeRule = new Rule(this, "ScheduleParameterChangeRule", new RuleProps
        {
            EventPattern = new EventPattern
            {
                Source = ["aws.ssm"],
                DetailType = ["Parameter Store Change"],
                Detail = new Dictionary<string, object>
                {
                    ["name"] = new[] { scheduleRateParameter.ParameterName },
                    ["operation"] = new[] { "Update" }
                }
            },
            Targets = [new LambdaFunction(updateScheduleLambda)]
        });

        // Set the Lambda function as the target of the rule
        rule.AddTarget(new LambdaFunction(updateHistoryJobLambda));

        #endregion

        #endregion

        #region Outputs

        var spotifyHistoryLambdaName = new CfnOutput(this, "SpotifyHistoryLambdaName", new CfnOutputProps
        {
            Value = updateHistoryJobLambda.FunctionName,
            Description = "Name of the Lambda function fetching Spotify history",
            ExportName = "SpotifyHistoryLambdaName"
        });

        #endregion

        #region CDK Nag Suppressions

        NagSuppressions.AddStackSuppressions(this, [
            new NagPackSuppression
            {
                Id = "AwsSolutions-IAM4",
                Reason = "Permissions are implicitly defined with managed policies."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-IAM5",
                Reason = "Permissions are implicitly defined with wildcards."
            }
        ]);

        #endregion
    }

    /// <summary>
    ///     Gets the name of the Lambda function that updates the Spotify history
    /// </summary>
    public string UpdateHistoryJobLambdaName => updateHistoryJobLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the DynamoDB table that stores the Spotify history
    /// </summary>
    public string HistoryTableName => historyTable.TableName;
}

