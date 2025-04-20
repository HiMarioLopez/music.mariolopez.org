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
///     Defines the stack for the Token Refresh Notification Stack.
/// </summary>
public sealed class TokenRefreshNotificationStack : Stack
{
    private readonly Function tokenRefreshFunction;

    /// <summary>
    ///     Initializes a new instance of the TokenRefreshNotificationStack class.
    /// </summary>
    internal TokenRefreshNotificationStack(Construct scope, string id, IStackProps? props = null,
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
        TokenRefreshTopic = tokenRefreshTopic;

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
        tokenRefreshFunction = tokenRefreshNotificationLambdaConstruct.Function;

        #endregion

        #endregion

        #region Event Sources and Subscriptions

        // Connect SNS topic to Token Refresh Notification Lambda
        tokenRefreshTopic.AddSubscription(new LambdaSubscription(tokenRefreshFunction));

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

    public Topic TokenRefreshTopic { get; }
    public string TokenRefreshNotificationLambdaName => tokenRefreshFunction.FunctionName;
}