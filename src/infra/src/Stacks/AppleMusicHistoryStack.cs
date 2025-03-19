using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.SSM;
using Amazon.CDK.AWS.CloudWatch;
using Constructs;
using Microsoft.Extensions.Configuration;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the Apple Music History Tracker.
/// </summary>
/// <remarks>
/// This stack contains resources for tracking Apple Music listening history:
/// - Lambda function for fetching and storing track history
/// - DynamoDB table for persistent storage
/// - CloudWatch Event Rule for scheduled execution
/// - SSM Parameter for storing the last processed track ID
/// </remarks>
public class AppleMusicHistoryStack : Stack
{
    internal AppleMusicHistoryStack(Construct scope, string id, IStackProps props = null, IConfiguration configuration = null)
        : base(scope, id, props)
    {
        #region DynamoDB Table

        var historyTable = new Table(this, "AppleMusicHistory", new TableProps
        {
            TableName = "AppleMusicHistory",
            PartitionKey = new Attribute { Name = "id", Type = AttributeType.STRING },
            BillingMode = BillingMode.PAY_PER_REQUEST,
        });

        #endregion

        #region IAM Role for Lambda

        var historyLambdaRole = new Role(this, "AppleMusicHistoryLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for Apple Music History tracking Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add permissions for DynamoDB and SSM
        historyLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
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
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/LastProcessedTrackId"
            ]
        }));

        // Add CloudWatch permissions
        historyLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        #endregion

        #region SSM Parameters

        var lastProcessedTrackIdParameter = new StringParameter(this, "LastProcessedTrackId", new StringParameterProps
        {
            ParameterName = "/Music/AppleMusicHistory/LastProcessedTrackId",
            StringValue = "placeholder", // Initial placeholder value
            Description = "Stores the ID of the last processed track to enable deduplication",
        });

        var scheduleRateParameter = new StringParameter(this, "HistoryScheduleRate", new StringParameterProps
        {
            ParameterName = "/Music/AppleMusicHistory/ScheduleRate",
            StringValue = "rate(5 minutes)", // Default value
            Description = "Schedule rate for Apple Music history tracking (using Schedule expression syntax)",
        });

        #endregion

        #region Lambda Functions

        // Scheduler Lambda for fetching and storing history
        var historyLambda = new Function(this, "AppleMusicHistoryLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/record-track-history/record-track-history-nodejs/dist"),
            Role = historyLambdaRole,
            MemorySize = 256,
            Timeout = Duration.Seconds(60),
            Description = "Fetches and stores Apple Music listening history",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME"] = historyTable.TableName,
                ["LAST_PROCESSED_TRACK_PARAMETER"] = lastProcessedTrackIdParameter.ParameterName,
                ["MUSIC_USER_TOKEN_PARAMETER"] = "/Music/AdminPanel/MUT"
            }
        });

        #endregion

        #region CloudWatch Event Rule (Scheduler)

        var rule = new Rule(this, "AppleMusicHistorySchedule", new RuleProps
        {
            Schedule = Schedule.Expression(Token.AsString(scheduleRateParameter.StringValue)), // Use SSM parameter value
            Description = "Schedule for fetching Apple Music history"
        });

        // Set the Lambda function as the target of the rule
        rule.AddTarget(new LambdaFunction(historyLambda));

        #endregion

        #region CloudWatch Dashboard

        var dashboard = new Dashboard(this, "AppleMusicHistoryDashboard", new DashboardProps
        {
            DashboardName = "AppleMusicHistoryDashboard"
        });

        dashboard.AddWidgets(
        [
            new GraphWidget(new GraphWidgetProps
            {
                Title = "History Tracking Lambda",
                Width = 12,
                Height = 6,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Invocations",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", historyLambda.FunctionName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", historyLambda.FunctionName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", historyLambda.FunctionName }
                        }
                    })
                ]
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "DynamoDB Table",
                Width = 12,
                Height = 6,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/DynamoDB",
                        MetricName = "ConsumedReadCapacityUnits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "TableName", historyTable.TableName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/DynamoDB",
                        MetricName = "ConsumedWriteCapacityUnits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "TableName", historyTable.TableName }
                        }
                    })
                ]
            }),
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "Error Logs",
                Width = 24,
                Height = 6,
                LogGroupNames =
                [
                    historyLambda.LogGroup.LogGroupName
                ],
                QueryString = "filter @message like /Error/\n| sort @timestamp desc\n| limit 20"
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Tracks Processed",
                Width = 24,
                Height = 8,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicHistory",
                        MetricName = "TracksProcessed",
                        Statistic = "Sum",
                        Period = Duration.Minutes(5)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicHistory",
                        MetricName = "NewTracksStored",
                        Statistic = "Sum",
                        Period = Duration.Minutes(5)
                    })
                ],
                View = GraphWidgetView.TIME_SERIES
            })
        ]);

        #endregion

        #region Outputs

        var appleMusicHistoryTableName = new CfnOutput(this, "AppleMusicHistoryTableName", new CfnOutputProps
        {
            Value = historyTable.TableName,
            Description = "Name of the DynamoDB table storing Apple Music history",
            ExportName = "AppleMusicHistoryTableName"
        });

        var appleMusicHistoryLambdaName = new CfnOutput(this, "AppleMusicHistoryLambdaName", new CfnOutputProps
        {
            Value = historyLambda.FunctionName,
            Description = "Name of the Lambda function fetching Apple Music history",
            ExportName = "AppleMusicHistoryLambdaName"
        });

        #endregion
    }
}