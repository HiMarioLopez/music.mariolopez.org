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
///     Defines the stack for the Token Refresh Job.
/// </summary>
public sealed class TokenRefreshJobStack : Stack
{
    private readonly Function tokenRefreshNotificationLambda;

    /// <summary>
    ///     Initializes a new instance of the TokenRefreshJobStack class.
    /// </summary>
    internal TokenRefreshJobStack(Construct scope, string id, IStackProps? props = null,
        IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region SNS Topic for Token Refresh Notifications

        // Create an SNS topic for token refresh notifications
        var tokenRefreshTopic = new Topic(this, "AppleMusicApiTokenRefreshTopic", new TopicProps
        {
            TopicName = "AppleMusicApiTokenRefreshTopic",
            DisplayName = "Apple Music API Token Refresh",
            EnforceSSL = true
        });

        #endregion

        #region Lambda Functions and Roles

        #region Token Refresh Notification Lambda

        // Role for the Token Refresh Notification Lambda
        var tokenRefreshNotificationLambdaRole = new Role(this, "TokenRefreshNotificationLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for Token Refresh Notification Lambda functions",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add permissions for SES
        tokenRefreshNotificationLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ses:SendEmail"],
            Resources = [$"arn:aws:ses:{Region}:{Account}:identity/*"]
        }));

        // Add CloudWatch permissions to Lambda role
        tokenRefreshNotificationLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Token Refresh Notification Lambda
        var tokenRefreshNotificationLambdaConstruct = new NodejsLambdaFunction(this,
            "AppleMusicApiTokenRefreshNotificationLambda", new NodejsLambdaFunctionProps
            {
                Handler = "token-refresh-notification.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/event-handlers"),
                Role = tokenRefreshNotificationLambdaRole,
                Description = "Sends notifications when Apple Music API token needs to be refreshed",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["ADMIN_EMAIL"] = configuration!["AppleMusicApi:Email:AdminEmail"]!,
                    ["SOURCE_EMAIL"] = configuration["AppleMusicApi:Email:SourceEmail"]!
                }
            });
        tokenRefreshNotificationLambda = tokenRefreshNotificationLambdaConstruct.Function;

        #endregion

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
                    ["ADMIN_EMAIL"] = configuration["MusicAdminSettings:AdminEmail"] ?? "admin@example.com",
                    ["SOURCE_EMAIL"] = configuration["MusicAdminSettings:SourceEmail"] ?? "noreply@example.com"
                }
            }).Function;

        #endregion

        #endregion

        #region Event Sources and Subscriptions

        // Connect SNS topic to Token Refresh Notification Lambda
        tokenRefreshTopic.AddSubscription(new LambdaSubscription(tokenRefreshNotificationLambda));

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
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-APIG3",
                Reason = "Default protections are fine; Extra fees associated with WAF."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-APIG4",
                Reason = "This is a public API."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-COG4",
                Reason = "This is a public API."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-SMG4",
                Reason = "This secret will soon be an SSM Parameter."
            }
        ]);

        #endregion
    }

    public string TokenRefreshNotificationLambdaName => tokenRefreshNotificationLambda.FunctionName;
}