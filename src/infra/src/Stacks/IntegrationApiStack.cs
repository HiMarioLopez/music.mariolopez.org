using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SSM;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Constructs;
using Music.Infra.Models.Settings;

namespace Music.Infra.Stacks;

/// <summary>
///     Defines the stack for the Music Integration API.
/// </summary>
/// <remarks>
///     Pricing Information:
///     - https://aws.amazon.com/lambda/pricing/
///     - https://aws.amazon.com/api-gateway/pricing/
///     - https://aws.amazon.com/secrets-manager/pricing/
/// </remarks>
public sealed class IntegrationApiStack : Stack
{
    /// <summary>
    ///     Initializes a new instance of the IntegrationApiStack class.
    /// </summary>
    internal IntegrationApiStack(Construct scope, string id, Topic tokenRefreshTopic, IStackProps? props = null,
        IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region API Gateway

        // TODO: Add this back at some point... (?)
        // var corsSettings = configuration?.GetSection("MusicApiSettings").Get<MusicApiSettings>();

        // Certificate for music.mariolopez.org
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-ApiCertificate", rootCertificateArn!);

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
                AllowHeaders =
                [
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "Music-User-Token"
                ],
                AllowOrigins = Cors.ALL_ORIGINS,
                AllowMethods = Cors.ALL_METHODS
            },
            CloudWatchRole = true
        });

        #endregion

        #region Auth Secret and Parameter Store

        var appleAuthKey = new Secret(this, "Music-AppleAuthKey", new SecretProps
        {
            SecretName = "AppleAuthKey"
        });

        var appleSettings = configuration!.GetSection("AppleSettings").Get<AppleDeveloperSettings>();
        var teamId = appleSettings!.TeamId;
        var keyId = appleSettings.KeyId;

        // SSM Parameter Store for Apple Music API Token
        var appleMusicTokenParameter = StringParameter.FromSecureStringParameterAttributes(this, "AppleMusicApiToken",
            new SecureStringParameterAttributes
            {
                ParameterName = "/Music/AdminPanel/Apple/MUT"
            });

        #endregion

        #region Lambda Functions and Roles

        #region Get Developer Auth Token Lambda (Version 1)

        // Auth Handler Lambda Role
        var authHandlerRole = new Role(this, "Music-NodejsAuthHandlerExecutionRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add Secret Manager permissions to Auth Handler role
        authHandlerRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [appleAuthKey.SecretArn],
            Effect = Effect.ALLOW
        }));

        // Get Developer Token Handler Lambda
        var authHandler = new NodejsLambdaFunction(this, "Music-NodejsAuthHandlerLambda",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-developer-token.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = authHandlerRole,
                Description = "Generates a token for use with Apple's Music API. Built with Node.js.",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["APPLE_AUTH_KEY_SECRET_NAME"] = appleAuthKey.SecretName,
                    ["APPLE_TEAM_ID"] = teamId,
                    ["APPLE_KEY_ID"] = keyId
                }
            }).Function;

        #endregion

        #region Get Data from Apple Music Lambda (Version 1)

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

        // Add permissions for SNS
        appleMusicLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["sns:Publish"],
            Resources = [tokenRefreshTopic.TopicArn]
        }));

        // Add CloudWatch permissions to Lambda role
        appleMusicLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Apple Music API Data Fetching Lambda
        var dataFetchingLambdaConstruct = new NodejsLambdaFunction(this, "AppleMusicApiDataFetchingLambda",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-data-from-apple-music.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = appleMusicLambdaRole,
                MemorySize = 256,
                Description = "Fetches data from Apple Music API and handles caching strategies",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["TOKEN_REFRESH_SNS_TOPIC_ARN"] = tokenRefreshTopic.TopicArn,
                    ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"]!,
                    ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"]!,
                    ["MUSIC_USER_TOKEN_PARAMETER"] = "/Music/AdminPanel/Apple/MUT"
                }
            });
        appleMusicDataFetchingLambda = dataFetchingLambdaConstruct.Function;

        #endregion

        #region Get Song History Lambda (Version 1)

        var getSongHistoryLambdaRole = new Role(this, "GetSongHistoryLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-song-history Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add CloudWatch permissions to MusicBrainz Lambda role
        getSongHistoryLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add DynamoDB permissions for song history
        getSongHistoryLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/AppleMusicHistory"])]
        }));

        // Add SSM Parameter Store read permission
        getSongHistoryLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/TableName"]
        }));

        var getSongHistoryLambda = new NodejsLambdaFunction(this, "GetSongHistoryFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-song-history.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = getSongHistoryLambdaRole,
                Description = "Fetches song history from DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/AppleMusicHistory/TableName",
                    ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"]!,
                    ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"]!
                }
            }).Function;

        #endregion

        #endregion

        #region API Gateway Resources

        var nodejsResource = new ApiGatewayResource(this, "NodejsResource", new ApiGatewayResourceProps
        {
            ParentResource = apiGateway.Root,
            PathPart = "nodejs"
        }).Resource;

        var version1Resource = new ApiGatewayResource(this, "Version1Resource", new ApiGatewayResourceProps
        {
            ParentResource = nodejsResource,
            PathPart = "v1"
        }).Resource;

        var authResource = new ApiGatewayResource(this, "AuthResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "auth"
        }).Resource;

        var tokenResource = new ApiGatewayResource(this, "TokenResource", new ApiGatewayResourceProps
        {
            ParentResource = authResource,
            PathPart = "token"
        }).Resource;

        var historyResource = new ApiGatewayResource(this, "HistoryResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "history"
        }).Resource;

        var musicHistoryResource = new ApiGatewayResource(this, "MusicHistoryResource", new ApiGatewayResourceProps
        {
            ParentResource = historyResource,
            PathPart = "music"
        }).Resource;

        var appleMusicResource = new ApiGatewayResource(this, "AppleMusicResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "apple-music"
        }).Resource;

        var appleMusicProxyResource = new ApiGatewayProxyResource(this, "AppleMusicProxyResource",
            new ApiGatewayProxyResourceProps
            {
                ParentResource = appleMusicResource
            }).ProxyResource;

        #endregion

        #region API Gateway Integration

        var authIntegration = new ApiGatewayIntegration(this, "AuthIntegration", new ApiGatewayIntegrationProps
        {
            Function = authHandler
        });

        var musicHistoryIntegration = new ApiGatewayIntegration(this, "MusicHistoryIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = getSongHistoryLambda
            });

        var appleMusicIntegration = new ApiGatewayIntegration(this, "AppleMusicIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = appleMusicDataFetchingLambda,
                Proxy = true,
                PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH
            });

        #endregion

        #region API Gateway Methods

        var requestValidator = new RequestValidator(this, "Music-AdminApiRequestValidator", new RequestValidatorProps
        {
            RestApi = apiGateway,
            ValidateRequestBody = true,
            ValidateRequestParameters = true
        });

        var getTokenMethod = new ApiGatewayMethod(this, "GetTokenMethod", new ApiGatewayMethodProps
        {
            Resource = tokenResource,
            HttpMethod = "GET",
            Integration = authIntegration.Integration,
            RequestValidator = requestValidator
        });

        var getMusicHistoryMethod = new ApiGatewayMethod(this, "GetMusicHistoryMethod", new ApiGatewayMethodProps
        {
            Resource = musicHistoryResource,
            HttpMethod = "GET",
            Integration = musicHistoryIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            RequestValidator = requestValidator
        });

        var appleMusicProxyMethod = new ApiGatewayMethod(this, "AppleMusicProxyMethod", new ApiGatewayMethodProps
        {
            Resource = appleMusicProxyResource,
            HttpMethod = "ANY",
            Integration = appleMusicIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false,
            RequestParameters = new Dictionary<string, bool>
            {
                ["method.request.header.Authorization"] = false // false means optional
            },
            RequestValidator = requestValidator
        });

        var nodejsProxyMethod = new ApiGatewayMethod(this, "NodejsProxyMethod", new ApiGatewayMethodProps
        {
            Resource = nodejsResource,
            HttpMethod = "ANY",
            Integration = appleMusicIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false,
            RequestValidator = requestValidator
        });

        #endregion

        #region Outputs

        var apiDomainName = new CfnOutput(this, "Music-ApiGatewayCustomDomainName", new CfnOutputProps
        {
            Value = apiGateway.DomainName!.DomainNameAliasDomainName,
            ExportName = "Music-ApiGatewayCustomDomainName"
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
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-APIG1",
                Reason = "Logging is relatively expensive. Will enable when needed for debugging."
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
                Id = "AwsSolutions-APIG6",
                Reason = "Logging is relatively expensive. Will enable when needed for debugging."
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

    #region Fields

    private readonly Function appleMusicDataFetchingLambda;

    #endregion

    #region Properties

    /// <summary>
    ///     Gets the name of the Apple Music data fetching Lambda function
    /// </summary>
    public string AppleMusicDataFetchingLambdaName => appleMusicDataFetchingLambda.FunctionName;

    #endregion
}