using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.SNS;
using Amazon.CDK.AWS.SNS.Subscriptions;
using Amazon.CDK.AWS.SSM;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Models.Settings;

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
    // Private fields for Lambda functions
    private readonly Function dataFetchingLambda;
    private readonly Function tokenRefreshNotificationLambda;
    private readonly Function musicBrainzDataFetchingLambda;
    private readonly Function getRecommendationsLambda;
    private readonly Function setRecommendationsLambda;
    private readonly Function getRecommendationNotesLambda;
    private readonly Function setRecommendationNotesLambda;
    private readonly Function getRecommendationReviewsLambda;
    private readonly Function setRecommendationReviewLambda;

    /// <summary>
    /// Gets the name of the Apple Music data fetching Lambda function
    /// </summary>
    public string AppleMusicDataFetchingLambdaName => dataFetchingLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Apple Music token refresh notification Lambda function
    /// </summary>
    public string TokenRefreshNotificationLambdaName => tokenRefreshNotificationLambda.FunctionName;

    /// <summary>
    /// Gets the name of the MusicBrainz data fetching Lambda function
    /// </summary>
    public string MusicBrainzDataFetchingLambdaName => musicBrainzDataFetchingLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Get Recommendations Lambda function
    /// </summary>
    public string GetRecommendationsLambdaName => getRecommendationsLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Set Recommendations Lambda function
    /// </summary>
    public string SetRecommendationsLambdaName => setRecommendationsLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Get Recommendation Notes Lambda function
    /// </summary>
    public string GetRecommendationNotesLambdaName => getRecommendationNotesLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Set Recommendation Notes Lambda function
    /// </summary>
    public string SetRecommendationNotesLambdaName => setRecommendationNotesLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Get Recommendation Reviews Lambda function
    /// </summary>
    public string GetRecommendationReviewsLambdaName => getRecommendationReviewsLambda.FunctionName;

    /// <summary>
    /// Gets the name of the Set Recommendation Review Lambda function
    /// </summary>
    public string SetRecommendationReviewLambdaName => setRecommendationReviewLambda.FunctionName;

    internal IntegrationApiStack(Construct scope, string id, IStackProps props = null, IConfiguration configuration = null)
        : base(scope, id, props)
    {
        var corsSettings = configuration?.GetSection("MusicApiSettings").Get<MusicApiSettings>();

        #region API Gateway

        // Certificate for music.mariolopez.org
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-ApiCertificate", rootCertificateArn);

        // Create a role for API Gateway to write to CloudWatch Logs
        var apiGatewayCloudWatchRole = new Role(this, "Music-IntegrationApiGatewayCloudWatchRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("apigateway.amazonaws.com"),
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AmazonAPIGatewayPushToCloudWatchLogs")
            ]
        });

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
                AllowOrigins = corsSettings?.AllowedOrigins,
                AllowMethods = Cors.ALL_METHODS
            },
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
        var appleMusicTokenParameter = StringParameter.FromSecureStringParameterAttributes(this, "AppleMusicApiToken", new SecureStringParameterAttributes
        {
            ParameterName = "/Music/AdminPanel/MUT",
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

        #region Apple Music Lambda

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
            Actions =
            [
                "sns:Publish"
            ],
            Resources =
            [
                tokenRefreshTopic.TopicArn
            ]
        }));

        // Add CloudWatch permissions to Lambda role
        appleMusicLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Apple Music API Data Fetching Lambda
        dataFetchingLambda = new Function(this, "AppleMusicApiDataFetchingLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "apple-music-data-fetching.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = appleMusicLambdaRole,
            MemorySize = 512,
            Timeout = Duration.Seconds(30),
            Description = "Fetches data from Apple Music API and handles caching strategies",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["TOKEN_REFRESH_SNS_TOPIC_ARN"] = tokenRefreshTopic.TopicArn,
                ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"],
                ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"],
                ["MUSIC_USER_TOKEN_PARAMETER"] = "/Music/AdminPanel/MUT"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Token Refresh Notification Lambda

        // Role for the Token Refresh Notification Lambda
        var tokenRefreshNotificationLambdaRole = new Role(this, "TokenRefreshNotificationLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for Token Refresh Notification Lambda functions",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
            ]
        });

        // Add permissions for SES
        tokenRefreshNotificationLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions =
            [
                "ses:SendEmail"
            ],
            Resources =
            [
                $"arn:aws:ses:{Region}:{Account}:identity/*"
            ]
        }));

        // Add CloudWatch permissions to Lambda role
        tokenRefreshNotificationLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Token Refresh Notification Lambda
        tokenRefreshNotificationLambda = new Function(this, "AppleMusicApiTokenRefreshNotificationLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "token-refresh-notification.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/event-handlers"),
            Role = tokenRefreshNotificationLambdaRole,
            MemorySize = 256,
            Timeout = Duration.Seconds(10),
            Description = "Sends notifications when Apple Music API token needs to be refreshed",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["ADMIN_EMAIL"] = configuration["AppleMusicApi:Email:AdminEmail"],
                ["SOURCE_EMAIL"] = configuration["AppleMusicApi:Email:SourceEmail"]
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Auth Handler Lambda

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
            Handler = "get-developer-token.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
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
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region MusicBrainz Lambda

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

        musicBrainzDataFetchingLambda = new Function(this, "MusicBrainzApiDataFetchingLambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "musicbrainz-data-fetching.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = musicBrainzLambdaRole,
            MemorySize = 512,
            Timeout = Duration.Seconds(30),
            Description = "Fetches data from MusicBrainz API for music recommendations",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"],
                ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"]
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Get Song History Lambda

        var getSongHistoryLambdaRole = new Role(this, "GetSongHistoryLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-song-history Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
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
            Actions = [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/AppleMusicHistory"
                ])
            ]
        }));

        // Add SSM Parameter Store read permission
        getSongHistoryLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/TableName"]
        }));

        var getSongHistoryLambda = new Function(this, "GetSongHistoryFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-song-history.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = getSongHistoryLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Fetches song history from DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/AppleMusicHistory/TableName",
                ["UPSTASH_REDIS_URL"] = configuration["AppleMusicApi:UpstashRedis:Url"],
                ["UPSTASH_REDIS_TOKEN"] = configuration["AppleMusicApi:UpstashRedis:Token"]
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Get Recommendations Lambda

        // Role for the Get Recommendations Lambda
        var getRecommendationsLambdaRole = new Role(this, "GetRecommendationsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-recommendations Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB read permissions
        getRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/MusicRecommendations/index/EntityTypeVotesIndex"
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/TableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/EntityTypeVotesIndexName"
            ]
        }));

        // Get Recommendations Lambda - To be implemented
        getRecommendationsLambda = new Function(this, "GetRecommendationsFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-recommendations.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = getRecommendationsLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Fetches music recommendations from DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/TableName",
                ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] = "/Music/Recommendations/EntityTypeVotesIndexName"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Set Recommendations Lambda

        // Role for the Set Recommendations Lambda
        var setRecommendationsLambdaRole = new Role(this, "SetRecommendationsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for set-recommendations Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB write permissions
        setRecommendationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/MusicRecommendations"
                ]),
            ]
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/TableName"
            ]
        }));

        // Set Recommendations Lambda - To be implemented
        setRecommendationsLambda = new Function(this, "SetRecommendationsFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "set-recommendations.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = setRecommendationsLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Creates and stores music recommendations in DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/TableName"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Get Recommendation Notes Lambda

        // Role for the Get Recommendation Notes Lambda
        var getRecommendationNotesLambdaRole = new Role(this, "GetRecommendationNotesLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-recommendation-notes Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB read permissions
        getRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/MusicRecommendationNotes"
                ])
            ]
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesModerationStatusIndexName"
            ]
        }));

        // Get Recommendations Lambda - To be implemented
        getRecommendationNotesLambda = new Function(this, "GetRecommendationNotesFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-recommendation-notes.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = getRecommendationNotesLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Fetches music recommendation notes from DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] = "/Music/Recommendations/NotesModerationStatusIndexName"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Set Recommendation Notes Lambda

        // Role for the Set Recommendation Notes Lambda
        var setRecommendationNotesLambdaRole = new Role(this, "SetRecommendationNotesLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for set-recommendation-notes Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB write permissions
        setRecommendationNotesLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/MusicRecommendationNotes"
                ]),
            ]
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/RecommendationNotes/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/RecommendationNotes/NotesModerationStatusIndexName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Moderation/OpenAIApiKey"
            ]
        }));

        // Set Recommendations Lambda - To be implemented
        setRecommendationNotesLambda = new Function(this, "SetRecommendationNotesFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "set-recommendation-notes.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = setRecommendationNotesLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Creates and stores music recommendation notes in DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/RecommendationNotes/NotesTableName",
                ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] = "/Music/RecommendationNotes/NotesModerationStatusIndexName",
                ["OPENAI_API_KEY_PARAMETER"] = "/Music/Moderation/OpenAIApiKey"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Get Recommendation Reviews Lambda

        // Role for the Get Recommendation Reviews Lambda
        var getRecommendationReviewsLambdaRole = new Role(this, "GetRecommendationReviewsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for get-recommendation-reviews Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB read permissions
        getRecommendationReviewsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/MusicRecommendationNotes"
                ])
            ]
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesUserNotesIndexName"
            ]
        }));

        // Get Recommendation Reviews Lambda
        getRecommendationReviewsLambda = new Function(this, "GetRecommendationReviewsFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-recommendation-reviews.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = getRecommendationReviewsLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Fetches music recommendation reviews (user notes) from DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_NOTES_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                ["DYNAMODB_NOTES_USER_INDEX_NAME_PARAMETER"] = "/Music/Recommendations/NotesUserNotesIndexName"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Set Recommendation Review Lambda

        // Role for the Set Recommendation Review Lambda
        var setRecommendationReviewLambdaRole = new Role(this, "SetRecommendationReviewLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for set-recommendation-review Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB write permissions
        setRecommendationReviewLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [
                Fn.Join("", [
                    "arn:aws:dynamodb:",
                    Region,
                    ":",
                    Account,
                    ":table/MusicRecommendationNotes"
                ]),
            ]
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Moderation/OpenAIApiKey"
            ]
        }));

        // Set Recommendation Review Lambda
        setRecommendationReviewLambda = new Function(this, "SetRecommendationReviewFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "set-recommendation-review.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/integration"),
            Role = setRecommendationReviewLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Description = "Creates and stores music recommendation reviews (user notes) in DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_NOTES_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                ["OPENAI_API_KEY_PARAMETER"] = "/Music/Moderation/OpenAIApiKey"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #region Moderation Checking Lambda

        // Role for the Check Pending Moderations Lambda
        var checkPendingModerationsLambdaRole = new Role(this, "CheckPendingModerationsLambdaRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            Description = "Role for the check-pending-moderations Lambda function",
            ManagedPolicies =
            [
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Add DynamoDB permissions to the role
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = [
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            Resources = [
                $"arn:aws:dynamodb:{Region}:{Account}:table/MusicRecommendationNotes",
                $"arn:aws:dynamodb:{Region}:{Account}:table/MusicRecommendationNotes/index/NoteModerationStatusIndex"
            ]
        }));

        // Add SSM Parameter Store read permission
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName"
            ]
        }));

        // Add SES permissions for sending emails
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ses:SendEmail"],
            Resources = [
                $"arn:aws:ses:{Region}:{Account}:identity/*"
            ]
        }));

        // Add CloudWatch permissions
        checkPendingModerationsLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["cloudwatch:PutMetricData"],
            Resources = ["*"]
        }));

        // Create check-pending-moderations Lambda function
        var checkPendingModerationsLambda = new Function(this, "CheckPendingModerationsFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "check-pending-moderations.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/event-handlers"),
            Role = checkPendingModerationsLambdaRole,
            MemorySize = 128,
            Timeout = Duration.Seconds(60),
            Description = "Checks for pending moderations and sends notification emails",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/Recommendations/NotesTableName",
                ["ADMIN_EMAIL"] = configuration["MusicAdminSettings:AdminEmail"] ?? "admin@example.com",
                ["SOURCE_EMAIL"] = configuration["MusicAdminSettings:SourceEmail"] ?? "noreply@example.com"
            },
            Tracing = Tracing.ACTIVE
        });

        #endregion

        #endregion

        #region Event Sources and Subscriptions

        // Connect SNS topic to Token Refresh Notification Lambda
        tokenRefreshTopic.AddSubscription(new LambdaSubscription(tokenRefreshNotificationLambda));

        // Create EventBridge rule to run check-pending-moderations on a schedule
        var checkPendingModerationsRule = new Amazon.CDK.AWS.Events.Rule(this, "CheckPendingModerationsRule", new Amazon.CDK.AWS.Events.RuleProps
        {
            Schedule = Amazon.CDK.AWS.Events.Schedule.Rate(Duration.Hours(12)),
            Description = "Runs every 12 hours to check for pending moderations",
            Enabled = true
        });

        // Add the Lambda as a target for the rule
        checkPendingModerationsRule.AddTarget(new Amazon.CDK.AWS.Events.Targets.LambdaFunction(checkPendingModerationsLambda));

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
            new LambdaIntegration(getSongHistoryLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add POST method for creating (single) recommendation
        var recommendationResource = nodejsResource.AddResource("recommendation");
        recommendationResource.AddMethod(
            "POST",
            new LambdaIntegration(setRecommendationsLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add GET method for retrieving (multiple) recommendations
        var recommendationsResource = nodejsResource.AddResource("recommendations");
        recommendationsResource.AddMethod(
            "GET",
            new LambdaIntegration(getRecommendationsLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add GET method for retrieving a single recommendation by ID
        var recommendationByIdResource = recommendationsResource.AddResource("{id}");
        recommendationByIdResource.AddMethod(
            "GET",
            new LambdaIntegration(getRecommendationsLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add GET method for retrieving notes for a specific recommendation
        var recommendationNotesResource = recommendationByIdResource.AddResource("notes");
        recommendationNotesResource.AddMethod(
            "GET",
            new LambdaIntegration(getRecommendationNotesLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add POST method for adding a note to a specific recommendation
        recommendationNotesResource.AddMethod(
            "POST",
            new LambdaIntegration(setRecommendationNotesLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add GET method for retrieving reviews for a specific recommendation
        var recommendationReviewsResource = recommendationByIdResource.AddResource("reviews");
        recommendationReviewsResource.AddMethod(
            "GET",
            new LambdaIntegration(getRecommendationReviewsLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add POST method for adding a review to a specific recommendation
        recommendationReviewsResource.AddMethod(
            "POST",
            new LambdaIntegration(setRecommendationReviewLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            }), new MethodOptions
            {
                AuthorizationType = AuthorizationType.NONE
            });

        // Add GET method for retrieving all reviews
        var allReviewsResource = nodejsResource.AddResource("reviews");
        allReviewsResource.AddMethod(
            "GET",
            new LambdaIntegration(getRecommendationReviewsLambda, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
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

        // MusicBrainz API endpoints
        var musicBrainzResource = nodejsResource.AddResource("musicbrainz");
        var musicBrainzLambdaIntegration = new LambdaIntegration(musicBrainzDataFetchingLambda, new LambdaIntegrationOptions
        {
            Proxy = true,
            PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH
        });
        var musicBrainzProxyResource = musicBrainzResource.AddResource("{proxy+}");

        musicBrainzProxyResource.AddMethod("ANY", musicBrainzLambdaIntegration, new MethodOptions
        {
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false
        });

        nodejsResource.AddMethod("ANY", nodejsLambdaIntegration, new MethodOptions
        {
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false
        });

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

        var musicBrainzApiEndpoint = new CfnOutput(this, "MusicBrainzApiEndpoint", new CfnOutputProps
        {
            Value = $"{apiGateway.Url}musicbrainz",
            Description = "Endpoint URL for the MusicBrainz API integration layer",
            ExportName = "MusicBrainzApiEndpoint"
        });

        #endregion
    }
}
