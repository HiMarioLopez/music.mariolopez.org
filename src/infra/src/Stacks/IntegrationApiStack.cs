using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Logs;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SSM;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Constructs;
using Music.Infra.Models.Settings;
using LogGroupProps = Amazon.CDK.AWS.Logs.LogGroupProps;

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

        var apiAccessLogGroup = new LogGroup(this, "Music-ApiAccessLogs", new LogGroupProps
        {
            Retention = RetentionDays.ONE_MONTH,
            RemovalPolicy = RemovalPolicy.DESTROY
        });

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
            DeployOptions = new StageOptions
            {
                StageName = "prod",
                AccessLogDestination = new LogGroupLogDestination(apiAccessLogGroup),
                AccessLogFormat = AccessLogFormat.JsonWithStandardFields(),
                LoggingLevel = MethodLoggingLevel.INFO,
                DataTraceEnabled = true,
                MetricsEnabled = true
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
                ParameterName = "/Music/AdminPanel/MUT"
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
                    ["MUSIC_USER_TOKEN_PARAMETER"] = "/Music/AdminPanel/MUT"
                }
            });
        appleMusicDataFetchingLambda = dataFetchingLambdaConstruct.Function;

        #endregion

        #region Get Data from MusicBrainz Lambda (Version 1)

        // MusicBrainz API Data Fetching Lambda
        var musicBrainzLambdaRole = new Role(this, "MusicBrainzApiLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for MusicBrainz API Lambda functions",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add CloudWatch permissions to MusicBrainz Lambda role
        musicBrainzLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        var musicBrainzDataFetchingLambdaConstruct = new NodejsLambdaFunction(this, "MusicBrainzApiDataFetchingLambda",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-data-from-musicbrainz.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = musicBrainzLambdaRole,
                Description = "Fetches data from MusicBrainz API for music recommendations",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"]!,
                    ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"]!
                }
            });
        musicBrainzDataFetchingLambda = musicBrainzDataFetchingLambdaConstruct.Function;

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

        #region Get Recommendations Lambda (Version 1)

        // Role for the Get Recommendations Lambda
        var getRecommendationsLambdaRole = new Role(this, "GetRecommendationsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-recommendations Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB read permissions
        getRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources =
            [
                Fn.Join("",
                [
                    "arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendations/index/EntityTypeVotesIndex"
                ])
            ]
        }));

        // Add CloudWatch permissions
        getRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add SSM Parameter Store read permission
        getRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources =
            [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/TableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/EntityTypeVotesIndexName"
            ]
        }));

        // Get Recommendations Lambda - To be implemented
        var getRecommendationsLambdaConstruct = new NodejsLambdaFunction(this, "GetRecommendationsFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-recommendations.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = getRecommendationsLambdaRole,
                Description = "Fetches music recommendations from DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/TableName",
                    ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] = "/Music/Recommendations/EntityTypeVotesIndexName"
                }
            });
        getRecommendationsLambda = getRecommendationsLambdaConstruct.Function;

        #endregion

        #region Set Recommendations Lambda (Version 1)

        // Role for the Set Recommendations Lambda
        var setRecommendationsLambdaRole = new Role(this, "SetRecommendationsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for set-recommendations Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB write permissions
        setRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendations"])]
        }));

        // Add CloudWatch permissions
        setRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add SSM Parameter Store read permission
        setRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/TableName"]
        }));

        // Set Recommendations Lambda - To be implemented
        var setRecommendationsLambdaConstruct = new NodejsLambdaFunction(this, "SetRecommendationsFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-recommendations.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = setRecommendationsLambdaRole,
                Description = "Creates and stores music recommendations in DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/TableName"
                }
            });
        setRecommendationsLambda = setRecommendationsLambdaConstruct.Function;

        #endregion

        #region Get Recommendation Notes Lambda (Version 1)

        // Role for the Get Recommendation Notes Lambda
        var getRecommendationNotesLambdaRole = new Role(this, "GetRecommendationNotesLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-recommendation-notes Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB read permissions
        getRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendationNotes"])]
        }));

        // Add CloudWatch permissions
        getRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add SSM Parameter Store read permission
        getRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources =
            [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesModerationStatusIndexName"
            ]
        }));

        // Get Recommendations Lambda - To be implemented
        var getRecommendationNotesLambdaConstruct = new NodejsLambdaFunction(this, "GetRecommendationNotesFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-recommendation-notes.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = getRecommendationNotesLambdaRole,
                Description = "Fetches music recommendation notes from DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                    ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] = "/Music/Recommendations/NotesModerationStatusIndexName"
                }
            });
        getRecommendationNotesLambda = getRecommendationNotesLambdaConstruct.Function;

        #endregion

        #region Set Recommendation Notes Lambda (Version 1)

        // Role for the Set Recommendation Notes Lambda
        var setRecommendationNotesLambdaRole = new Role(this, "SetRecommendationNotesLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for set-recommendation-notes Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB write permissions
        setRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendationNotes"])]
        }));

        // Add CloudWatch permissions
        setRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add SSM Parameter Store read permission
        setRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources =
            [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/RecommendationNotes/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/RecommendationNotes/NotesModerationStatusIndexName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Moderation/OpenAIApiKey"
            ]
        }));

        // Set Recommendations Lambda - To be implemented
        var setRecommendationNotesLambdaConstruct = new NodejsLambdaFunction(this, "SetRecommendationNotesFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-recommendation-notes.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = setRecommendationNotesLambdaRole,
                Description = "Creates and stores music recommendation notes in DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/RecommendationNotes/NotesTableName",
                    ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] =
                        "/Music/RecommendationNotes/NotesModerationStatusIndexName",
                    ["OPENAI_API_KEY_PARAMETER"] = "/Music/Moderation/OpenAIApiKey"
                }
            });
        setRecommendationNotesLambda = setRecommendationNotesLambdaConstruct.Function;

        #endregion

        #region Get Recommendation Reviews Lambda (Version 1)

        // Role for the Get Recommendation Reviews Lambda
        var getRecommendationReviewsLambdaRole = new Role(this, "GetRecommendationReviewsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-recommendation-reviews Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB read permissions
        getRecommendationReviewsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendationNotes"])]
        }));

        // Add CloudWatch permissions
        getRecommendationReviewsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add SSM Parameter Store read permission
        getRecommendationReviewsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources =
            [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesUserNotesIndexName"
            ]
        }));

        // Get Recommendation Reviews Lambda
        var getRecommendationReviewsLambdaConstruct = new NodejsLambdaFunction(this, "GetRecommendationReviewsFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-recommendation-reviews.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = getRecommendationReviewsLambdaRole,
                Description = "Fetches music recommendation reviews (user notes) from DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_NOTES_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                    ["DYNAMODB_NOTES_USER_INDEX_NAME_PARAMETER"] = "/Music/Recommendations/NotesUserNotesIndexName"
                }
            });
        getRecommendationReviewsLambda = getRecommendationReviewsLambdaConstruct.Function;

        #endregion

        #region Set Recommendation Review Lambda (Version 1)

        // Role for the Set Recommendation Review Lambda
        var setRecommendationReviewLambdaRole = new Role(this, "SetRecommendationReviewLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for set-recommendation-review Lambda function",
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add DynamoDB write permissions
        setRecommendationReviewLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendationNotes"])]
        }));

        // Add CloudWatch permissions
        setRecommendationReviewLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Add SSM Parameter Store read permission
        setRecommendationReviewLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources =
            [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Moderation/OpenAIApiKey"
            ]
        }));

        // Set Recommendation Review Lambda
        var setRecommendationReviewLambdaConstruct = new NodejsLambdaFunction(this, "SetRecommendationReviewFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-recommendation-review.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
                Role = setRecommendationReviewLambdaRole,
                Description = "Creates and stores music recommendation reviews (user notes) in DynamoDB",
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["DYNAMODB_NOTES_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                    ["OPENAI_API_KEY_PARAMETER"] = "/Music/Moderation/OpenAIApiKey"
                }
            });
        setRecommendationReviewLambda = setRecommendationReviewLambdaConstruct.Function;

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

        var recommendationResource = new ApiGatewayResource(this, "RecommendationResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "recommendation"
        }).Resource;

        var recommendationsResource = new ApiGatewayResource(this, "RecommendationsResource",
            new ApiGatewayResourceProps
            {
                ParentResource = version1Resource,
                PathPart = "recommendations"
            }).Resource;

        var recommendationByIdResource = new ApiGatewayResource(this, "RecommendationByIdResource",
            new ApiGatewayResourceProps
            {
                ParentResource = recommendationsResource,
                PathPart = "{id}"
            }).Resource;

        var recommendationNotesResource = new ApiGatewayResource(this, "RecommendationNotesResource",
            new ApiGatewayResourceProps
            {
                ParentResource = recommendationByIdResource,
                PathPart = "notes"
            }).Resource;

        var recommendationReviewsResource = new ApiGatewayResource(this, "RecommendationReviewsResource",
            new ApiGatewayResourceProps
            {
                ParentResource = recommendationByIdResource,
                PathPart = "reviews"
            }).Resource;

        var allReviewsResource = new ApiGatewayResource(this, "AllReviewsResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "reviews"
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

        var musicBrainzResource = new ApiGatewayResource(this, "MusicBrainzResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "musicbrainz"
        }).Resource;

        var musicBrainzProxyResource = new ApiGatewayProxyResource(this, "MusicBrainzProxyResource",
            new ApiGatewayProxyResourceProps
            {
                ParentResource = musicBrainzResource
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

        var setRecommendationsIntegration = new ApiGatewayIntegration(this, "SetRecommendationsIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = setRecommendationsLambda
            });

        var getRecommendationsIntegration = new ApiGatewayIntegration(this, "GetRecommendationsIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = getRecommendationsLambda
            });

        var getRecommendationNotesIntegration = new ApiGatewayIntegration(this, "GetRecommendationNotesIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = getRecommendationNotesLambda
            });

        var setRecommendationNotesIntegration = new ApiGatewayIntegration(this, "SetRecommendationNotesIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = setRecommendationNotesLambda
            });

        var getRecommendationReviewsIntegration = new ApiGatewayIntegration(this, "GetRecommendationReviewsIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = getRecommendationReviewsLambda
            });

        var setRecommendationReviewIntegration = new ApiGatewayIntegration(this, "SetRecommendationReviewIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = setRecommendationReviewLambda
            });

        var appleMusicIntegration = new ApiGatewayIntegration(this, "AppleMusicIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = appleMusicDataFetchingLambda,
                Proxy = true,
                PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH
            });

        var musicBrainzIntegration = new ApiGatewayIntegration(this, "MusicBrainzIntegration",
            new ApiGatewayIntegrationProps
            {
                Function = musicBrainzDataFetchingLambda,
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

        var postRecommendationMethod = new ApiGatewayMethod(this, "PostRecommendationMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationResource,
            HttpMethod = "POST",
            Integration = setRecommendationsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            RequestValidator = requestValidator
        });

        var getRecommendationsMethod = new ApiGatewayMethod(this, "GetRecommendationsMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationsResource,
            HttpMethod = "GET",
            Integration = getRecommendationsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            RequestValidator = requestValidator
        });

        var getRecommendationByIdMethod = new ApiGatewayMethod(this, "GetRecommendationByIdMethod",
            new ApiGatewayMethodProps
            {
                Resource = recommendationByIdResource,
                HttpMethod = "GET",
                Integration = getRecommendationsIntegration.Integration,
                AuthorizationType = AuthorizationType.NONE,
                RequestValidator = requestValidator
            });

        var getRecommendationNotesMethod = new ApiGatewayMethod(this, "GetRecommendationNotesMethod",
            new ApiGatewayMethodProps
            {
                Resource = recommendationNotesResource,
                HttpMethod = "GET",
                Integration = getRecommendationNotesIntegration.Integration,
                AuthorizationType = AuthorizationType.NONE,
                RequestValidator = requestValidator
            });

        var postRecommendationNotesMethod = new ApiGatewayMethod(this, "PostRecommendationNotesMethod",
            new ApiGatewayMethodProps
            {
                Resource = recommendationNotesResource,
                HttpMethod = "POST",
                Integration = setRecommendationNotesIntegration.Integration,
                AuthorizationType = AuthorizationType.NONE,
                RequestValidator = requestValidator
            });

        var getRecommendationReviewsMethod = new ApiGatewayMethod(this, "GetRecommendationReviewsMethod",
            new ApiGatewayMethodProps
            {
                Resource = recommendationReviewsResource,
                HttpMethod = "GET",
                Integration = getRecommendationReviewsIntegration.Integration,
                AuthorizationType = AuthorizationType.NONE,
                RequestValidator = requestValidator
            });

        var postRecommendationReviewMethod = new ApiGatewayMethod(this, "PostRecommendationReviewMethod",
            new ApiGatewayMethodProps
            {
                Resource = recommendationReviewsResource,
                HttpMethod = "POST",
                Integration = setRecommendationReviewIntegration.Integration,
                AuthorizationType = AuthorizationType.NONE,
                RequestValidator = requestValidator
            });

        var getAllReviewsMethod = new ApiGatewayMethod(this, "GetAllReviewsMethod", new ApiGatewayMethodProps
        {
            Resource = allReviewsResource,
            HttpMethod = "GET",
            Integration = getRecommendationReviewsIntegration.Integration,
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

        var musicBrainzProxyMethod = new ApiGatewayMethod(this, "MusicBrainzProxyMethod", new ApiGatewayMethodProps
        {
            Resource = musicBrainzProxyResource,
            HttpMethod = "ANY",
            Integration = musicBrainzIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false,
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

    #region Fields

    private readonly Function appleMusicDataFetchingLambda;
    private readonly Function musicBrainzDataFetchingLambda;
    private readonly Function getRecommendationsLambda;
    private readonly Function setRecommendationsLambda;
    private readonly Function getRecommendationNotesLambda;
    private readonly Function setRecommendationNotesLambda;
    private readonly Function getRecommendationReviewsLambda;
    private readonly Function setRecommendationReviewLambda;

    #endregion

    #region Properties

    /// <summary>
    ///     Gets the name of the Apple Music data fetching Lambda function
    /// </summary>
    public string AppleMusicDataFetchingLambdaName => appleMusicDataFetchingLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the MusicBrainz data fetching Lambda function
    /// </summary>
    public string MusicBrainzDataFetchingLambdaName => musicBrainzDataFetchingLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the Get Recommendations Lambda function
    /// </summary>
    public string GetRecommendationsLambdaName => getRecommendationsLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the Set Recommendations Lambda function
    /// </summary>
    public string SetRecommendationsLambdaName => setRecommendationsLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the Get Recommendation Notes Lambda function
    /// </summary>
    public string GetRecommendationNotesLambdaName => getRecommendationNotesLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the Set Recommendation Notes Lambda function
    /// </summary>
    public string SetRecommendationNotesLambdaName => setRecommendationNotesLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the Get Recommendation Reviews Lambda function
    /// </summary>
    public string GetRecommendationReviewsLambdaName => getRecommendationReviewsLambda.FunctionName;

    /// <summary>
    ///     Gets the name of the Set Recommendation Review Lambda function
    /// </summary>
    public string SetRecommendationReviewLambdaName => setRecommendationReviewLambda.FunctionName;

    #endregion
}