using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SNS.Subscriptions;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Constructs;

namespace Music.Infra.Stacks;

/// <summary>
///     Defines the stack for the Moderation Job Stack.
/// </summary>
public sealed class ModerationJobStack : Stack
{
    /// <summary>
    ///     Initializes a new instance of the ModerationJobStack class.
    /// </summary>
    internal ModerationJobStack(Construct scope, string id, IStackProps? props = null,
        IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region Lambda Functions and Roles

        #region Moderation Checking Lambda

        // Role for the Check Pending Moderations Lambda
        var checkPendingModerationsLambdaRole = new Role(this, "CheckPendingModerationsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for the check-pending-moderations Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB permissions to the role
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resources =
            [
                $"arn:aws:dynamodb:{Region}:{Account}:table/MusicRecommendationNotes",
                $"arn:aws:dynamodb:{Region}:{Account}:table/MusicRecommendationNotes/index/NoteModerationStatusIndex"
            ]
        }));

        // Add SSM Parameter Store read permission
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources =
            [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName"
            ]
        }));

        // Add SES permissions for sending emails
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ses:SendEmail"],
            Resources = [$"arn:aws:ses:{Region}:{Account}:identity/*"]
        }));

        // Add CloudWatch permissions
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Create check-pending-moderations Lambda function
        var checkPendingModerationsLambda = new NodejsLambdaFunction(this, "CheckPendingModerationsFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "check-pending-moderations.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/event-handlers"),
                Role = checkPendingModerationsLambdaRole,
                Description = "Checks for pending moderations and sends notification emails",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                    ["ADMIN_EMAIL"] = configuration!["AppleMusicApi:Email:AdminEmail"]!,
                    ["SOURCE_EMAIL"] = configuration["AppleMusicApi:Email:SourceEmail"]!
                }
            }).Function;

        #endregion

        #endregion

        #region Event Sources and Subscriptions

        // Create EventBridge rule to run check-pending-moderations on a schedule
        var checkPendingModerationsRule = new Rule(this, "CheckPendingModerationsRule", new RuleProps
        {
            Schedule = Schedule.Rate(Duration.Hours(12)),
            Description = "Runs every 12 hours to check for pending moderations",
            Enabled = true
        });

        // Add the Lambda as a target for the rule
        checkPendingModerationsRule.AddTarget(new LambdaFunction(checkPendingModerationsLambda));

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
}