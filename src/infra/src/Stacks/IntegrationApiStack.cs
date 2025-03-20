using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.Lambda.EventSources;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SNS.Subscriptions;
using Amazon.CDK.AWS.SQS;
using Amazon.CDK.AWS.SSM;
using Amazon.CDK.AWS.CloudWatch;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Models.Settings;
using Amazon.CDK.AWS.Events;
using Amazon.CDK.AWS.Events.Targets;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the Music Integration API.
/// </summary>
/// <remarks>
/// Pricing Information:
///     - https://aws.amazon.com/lambda/pricing/
///     - https://aws.amazon.com/api-gateway/pricing/
///     - https://aws.amazon.com/secrets-manager/pricing/
/// </remarks>
public class IntegrationApiStack : Stack
{
    internal IntegrationApiStack(Construct scope, string id, IStackProps props = null, IConfiguration configuration = null)
        : base(scope, id, props)
    {
        var corsSettings = configuration?.GetSection("MusicApiSettings").Get<MusicApiSettings>();

        #region API Gateway

        // Certificate for music.mariolopez.org
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-ApiCertificate", rootCertificateArn);

        // Create a new REST API
        var apiGateway = new RestApi(this, "Music-IntegrationApiGateway", new RestApiProps
        {
            RestApiName = "Music Integration API Gateway",
            Description = "This gateway serves a variety of integration-related services for the Music app.",
            DomainName = new DomainNameOptions
            {
                DomainName = "music.mariolopez.org",
                Certificate = rootCertificate,
                EndpointType = EndpointType.REGIONAL,
                BasePath = "api"
            },
            DefaultCorsPreflightOptions = new CorsOptions
            {
                AllowCredentials = true,
                AllowHeaders = [
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "Music-User-Token"
                ],
                AllowMethods = ["GET", "POST", "OPTIONS"],
                AllowOrigins = corsSettings?.AllowedOrigins
            }
        });

        #endregion

        #region Auth Secret and Parameter Store

        var appleAuthKey = new Secret(this, "Music-AppleAuthKey", new SecretProps
        {
            SecretName = "AppleAuthKey"
        });

        var appleSettings = configuration.GetSection("AppleSettings").Get<AppleDeveloperSettings>();
        var teamId = appleSettings.TeamId;
        var keyId = appleSettings.KeyId;

        // SSM Parameter Store for Apple Music API Token
        var appleMusicTokenParameter = StringParameter.FromSecureStringParameterAttributes(this, "AppleMusicApiToken",
            new SecureStringParameterAttributes
            {
                ParameterName = "/Music/AdminPanel/MUT",
            });

        #endregion

        #region SQS Queue for Failed Requests

        // Create an SQS queue for failed requests
        var failedRequestsQueue = new Queue(this, "AppleMusicApiFailedRequestsQueue", new QueueProps
        {
            QueueName = "AppleMusicApiFailedRequestsQueue",
            VisibilityTimeout = Duration.Seconds(1800), // 30 minutes
            RetentionPeriod = Duration.Days(14) // Maximum retention period
        });

        #endregion

        #region SNS Topic for Token Refresh Notifications

        // Create an SNS topic for token refresh notifications
        var tokenRefreshTopic = new Topic(this, "AppleMusicApiTokenRefreshTopic", new TopicProps
        {
            TopicName = "AppleMusicApiTokenRefreshTopic",
            DisplayName = "Apple Music API Token Refresh"
        });

        #endregion

        #region Lambda Functions and Roles

        // Role for the Apple Music API Lambda functions
        var appleMusicLambdaRole = new Role(this, "AppleMusicApiLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for Apple Music API Lambda functions",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                ManagedPolicy.FromAwsManagedPolicyName("AmazonSSMReadOnlyAccess")
            ]
        });

        // Add permissions for SQS, SNS, and SES
        appleMusicLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "sqs:SendMessage",
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes",
                "sns:Publish",
                "ses:SendEmail"
            ],
            Resources =
            [
                failedRequestsQueue.QueueArn,
                tokenRefreshTopic.TopicArn,
                $"arn:aws:ses:{Region}:{Account}:identity/*"
            ]
        }));

        // Add CloudWatch permissions to Lambda role
        appleMusicLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Auth Handler Lambda Role
        var nodejsAuthLambdaRole = new Role(this, "Music-NodejsAuthHandlerExecutionRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add Secret Manager permissions to Auth Handler role
        nodejsAuthLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [appleAuthKey.SecretArn],
            Effect = Effect.ALLOW
        }));

        // Get Developer Token Handler Lambda
        var nodejsAuthHandlerFunction = new Function(this, "Music-NodejsAuthHandlerLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Role = nodejsAuthLambdaRole,
            Code = Code.FromAsset("../app/backend/handlers/api/get-developer-token/get-developer-token-nodejs/dist"),
            Handler = "index.handler",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["APPLE_AUTH_KEY_SECRET_NAME"] = appleAuthKey.SecretName,
                ["APPLE_TEAM_ID"] = teamId,
                ["APPLE_KEY_ID"] = keyId
            },
            Description = "Generates a token for use with Apple's Music API. Built with Node.js.",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
        });

        // Apple Music API Data Fetching Lambda
        var dataFetchingLambda = new Function(this, "AppleMusicApiDataFetchingLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/api/apple-music-data-fetching/apple-music-data-fetching-nodejs/dist"),
            Role = appleMusicLambdaRole,
            MemorySize = 512,
            Timeout = Duration.Seconds(30),
            Description = "Fetches data from Apple Music API and handles caching strategies",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["TOKEN_REFRESH_SNS_TOPIC_ARN"] = tokenRefreshTopic.TopicArn,
                ["FAILED_REQUESTS_SQS_URL"] = failedRequestsQueue.QueueUrl,
                ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"],
                ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"]
            }
        });

        // Token Refresh Notification Lambda
        var tokenRefreshNotificationLambda = new Function(this, "AppleMusicApiTokenRefreshNotificationLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/token-refresh-notification/token-refresh-notification-nodejs/dist"),
            Role = appleMusicLambdaRole,
            MemorySize = 256,
            Timeout = Duration.Seconds(10),
            Description = "Sends notifications when Apple Music API token needs to be refreshed",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["ADMIN_EMAIL"] = configuration["AppleMusicApi:Email:AdminEmail"],
                ["SOURCE_EMAIL"] = configuration["AppleMusicApi:Email:SourceEmail"]
            }
        });

        // DLQ Processor Lambda
        var dlqProcessorLambda = new Function(this, "AppleMusicApiDlqProcessorLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/dlq-processor/dlq-processor-nodejs/dist"),
            Role = appleMusicLambdaRole,
            MemorySize = 256,
            Timeout = Duration.Seconds(60),
            Description = "Processes failed requests from the DLQ and attempts to retry them",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["API_GATEWAY_URL"] = apiGateway.Url
            }
        });

        #endregion

        #region Event Sources and Subscriptions

        // Connect SNS topic to Token Refresh Notification Lambda
        tokenRefreshTopic.AddSubscription(new LambdaSubscription(tokenRefreshNotificationLambda));

        // Connect SQS queue to DLQ Processor Lambda
        dlqProcessorLambda.AddEventSource(new SqsEventSource(failedRequestsQueue, new SqsEventSourceProps
        {
            BatchSize = 10,
            MaxBatchingWindow = Duration.Seconds(30)
        }));

        #endregion

        #region API Gateway Integration

        // Create base nodejs resource
        var nodejsResource = apiGateway.Root.AddResource("nodejs");

        // Auth endpoint
        var authResource = nodejsResource.AddResource("auth");
        var tokenResource = authResource.AddResource("token");
        tokenResource.AddMethod(
            "GET",
            new LambdaIntegration(nodejsAuthHandlerFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        // Add history endpoints to API Gateway
        var historyResource = nodejsResource.AddResource("history");
        var musicHistoryResource = historyResource.AddResource("music");
        musicHistoryResource.AddMethod(
            "GET",
            new LambdaIntegration(dataFetchingLambda, new LambdaIntegrationOptions
            {
                Proxy = true,
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Apple Music API endpoints
        var appleMusicResource = nodejsResource.AddResource("apple-music");
        var nodejsLambdaIntegration = new LambdaIntegration(dataFetchingLambda, new LambdaIntegrationOptions
        {
            Proxy = true,
            PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH
        });
        var nodejsProxyResource = appleMusicResource.AddResource("{proxy+}");

        nodejsProxyResource.AddMethod("ANY", nodejsLambdaIntegration, new MethodOptions
        {
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false,
            RequestParameters = new Dictionary<string, bool>
            {
                ["method.request.header.Authorization"] = false // false means optional
            }
        });

        nodejsResource.AddMethod("ANY", nodejsLambdaIntegration, new MethodOptions
        {
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false
        });

        #endregion

        #region CloudWatch Dashboard

        var dashboard = new Dashboard(this, "AppleMusicApiDashboard", new DashboardProps
        {
            DashboardName = "AppleMusicApiDashboard"
        });

        dashboard.AddWidgets(
        [
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Data Fetching Lambda",
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
                            { "FunctionName", dataFetchingLambda.FunctionName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", dataFetchingLambda.FunctionName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", dataFetchingLambda.FunctionName }
                        }
                    })
                ]
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Token Refresh Lambda",
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
                            { "FunctionName", tokenRefreshNotificationLambda.FunctionName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Errors",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", tokenRefreshNotificationLambda.FunctionName }
                        }
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AWS/Lambda",
                        MetricName = "Duration",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "FunctionName", tokenRefreshNotificationLambda.FunctionName }
                        }
                    })
                ]
            }),
            new LogQueryWidget(new LogQueryWidgetProps
            {
                Title = "Error Logs (All Lambdas)",
                Width = 24,
                Height = 6,
                LogGroupNames =
                [
                    dataFetchingLambda.LogGroup.LogGroupName,
                    tokenRefreshNotificationLambda.LogGroup.LogGroupName,
                    dlqProcessorLambda.LogGroup.LogGroupName
                ],
                QueryString = "filter @message like /Error/\n| sort @timestamp desc\n| limit 20"
            }),
            new GraphWidget(new GraphWidgetProps
            {
                Title = "Cache Performance",
                Width = 24,
                Height = 8,
                Left =
                [
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicAPI",
                        MetricName = "CacheHits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "service", "AppleMusicDataFetching" },
                            { "Source", "l1-cache" }
                        },
                        Label = "L1 Cache Hits",
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicAPI",
                        MetricName = "CacheHits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "service", "AppleMusicDataFetching" },
                            { "Source", "l2-cache" }
                        },
                        Label = "L2 Cache Hits",
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    }),
                    new Metric(new MetricProps
                    {
                        Namespace = "AppleMusicAPI",
                        MetricName = "CacheHits",
                        DimensionsMap = new Dictionary<string, string>
                        {
                            { "service", "AppleMusicDataFetching" },
                            { "Source", "api" }
                        },
                        Label = "API Calls",
                        Statistic = "Sum",
                        Period = Duration.Minutes(1)
                    })
                ],
                View = GraphWidgetView.TIME_SERIES,
                Stacked = true
            })
        ]);

        #endregion

        #region Outputs

        var apiDomainName = new CfnOutput(this, "Music-ApiGatewayCustomDomainName", new CfnOutputProps
        {
            Value = apiGateway.DomainName!.DomainNameAliasDomainName,
            ExportName = "Music-ApiGatewayCustomDomainName"
        });

        var apiGatewayId = new CfnOutput(this, "ApiGatewayId", new CfnOutputProps
        {
            Value = apiGateway.RestApiId,
            ExportName = "Music-IntegrationApiGateway-Id"
        });

        var apiGatewayRootResourceId = new CfnOutput(this, "ApiGatewayRootResourceId", new CfnOutputProps
        {
            Value = apiGateway.RestApiRootResourceId,
            ExportName = "Music-IntegrationApiGateway-RootResourceId"
        });

        var apiGatewayUrl = new CfnOutput(this, "ApiGatewayUrl", new CfnOutputProps
        {
            Value = apiGateway.Url,
            ExportName = "Music-IntegrationApiGateway-Url"
        });

        var appleMusicApiEndpoint = new CfnOutput(this, "AppleMusicApiEndpoint", new CfnOutputProps
        {
            Value = $"{apiGateway.Url}apple-music",
            Description = "Endpoint URL for the Apple Music API integration layer",
            ExportName = "AppleMusicApiEndpoint"
        });

        #endregion
    }
}
