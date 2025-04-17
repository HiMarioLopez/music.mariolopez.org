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
using Music.Infra.Constructs;

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
    #region Fields

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

    #endregion

    #region Properties

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

    #endregion

    /// <summary>
    /// Initializes a new instance of the IntegrationApiStack class.
    internal IntegrationApiStack(Construct scope, string id, IStackProps? props = null, IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        // var corsSettings = configuration?.GetSection("MusicApiSettings").Get<MusicApiSettings>();

        #region API Gateway

        // Certificate for music.mariolopez.org
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-ApiCertificate", rootCertificateArn!);

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
                AllowOrigins = Cors.ALL_ORIGINS,
                AllowMethods = Cors.ALL_METHODS
            },
        });

        #endregion

        #region Auth Secret and Parameter Store

        var appleAuthKey = new Secret(this, "Music-AppleAuthKey", new SecretProps
        {
            SecretName = "AppleAuthKey"
        });

        var appleSettings = configuration!.GetSection("AppleSettings").Get<AppleDeveloperSettings>();
        var teamId = appleSettings!.TeamId;
        var keyId = appleSettings!.KeyId;

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

        #region Get Developer Auth Token Lambda (Version 1)

        // Auth Handler Lambda Role
        var nodejsAuthLambdaRole = new Role(this, "Music-NodejsAuthHandlerExecutionRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies = [ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        // Add Secret Manager permissions to Auth Handler role
        nodejsAuthLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [appleAuthKey.SecretArn],
            Effect = Effect.ALLOW
        }));

        // Get Developer Token Handler Lambda
        var nodejsAuthHandlerFunction = new NodejsLambdaFunction(this, "Music-NodejsAuthHandlerLambda", new NodejsLambdaFunctionProps
        {
            Handler = "get-developer-token.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
            Role = nodejsAuthLambdaRole,
            Description = "Generates a token for use with Apple's Music API. Built with Node.js.",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["APPLE_AUTH_KEY_SECRET_NAME"] = appleAuthKey.SecretName,
                ["APPLE_TEAM_ID"] = teamId,
                ["APPLE_KEY_ID"] = keyId
            },
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
        var dataFetchingLambdaConstruct = new NodejsLambdaFunction(this, "AppleMusicApiDataFetchingLambda", new NodejsLambdaFunctionProps
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
            },
        });
        dataFetchingLambda = dataFetchingLambdaConstruct.Function;

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

        var musicBrainzDataFetchingLambdaConstruct = new NodejsLambdaFunction(this, "MusicBrainzApiDataFetchingLambda", new NodejsLambdaFunctionProps
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
            Actions = [
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

        var getSongHistoryLambda = new NodejsLambdaFunction(this, "GetSongHistoryFunction", new NodejsLambdaFunctionProps
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
            Actions = [
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            Resources = [Fn.Join("", ["arn:aws:dynamodb:", Region, ":", Account, ":table/MusicRecommendations/index/EntityTypeVotesIndex"])]
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
        var getRecommendationsLambdaConstruct = new NodejsLambdaFunction(this, "GetRecommendationsFunction", new NodejsLambdaFunctionProps
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
            Actions = [
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
        var setRecommendationsLambdaConstruct = new NodejsLambdaFunction(this, "SetRecommendationsFunction", new NodejsLambdaFunctionProps
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
            Actions = [
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesModerationStatusIndexName"
            ]
        }));

        // Get Recommendations Lambda - To be implemented
        var getRecommendationNotesLambdaConstruct = new NodejsLambdaFunction(this, "GetRecommendationNotesFunction", new NodejsLambdaFunctionProps
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
            Actions = [
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/RecommendationNotes/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/RecommendationNotes/NotesModerationStatusIndexName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Moderation/OpenAIApiKey"
            ]
        }));

        // Set Recommendations Lambda - To be implemented
        var setRecommendationNotesLambdaConstruct = new NodejsLambdaFunction(this, "SetRecommendationNotesFunction", new NodejsLambdaFunctionProps
        {
            Handler = "set-recommendation-notes.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/integration"),
            Role = setRecommendationNotesLambdaRole,
            Description = "Creates and stores music recommendation notes in DynamoDB",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["DYNAMODB_TABLE_NAME_PARAMETER"] = "/Music/RecommendationNotes/NotesTableName",
                ["DYNAMODB_TABLE_INDEX_NAME_PARAMETER"] = "/Music/RecommendationNotes/NotesModerationStatusIndexName",
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
            Actions = [
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesUserNotesIndexName"
            ]
        }));

        // Get Recommendation Reviews Lambda
        var getRecommendationReviewsLambdaConstruct = new NodejsLambdaFunction(this, "GetRecommendationReviewsFunction", new NodejsLambdaFunctionProps
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
            Actions = [
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
            Resources = [
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Recommendations/NotesTableName",
                $"arn:aws:ssm:{Region}:{Account}:parameter/Music/Moderation/OpenAIApiKey"
            ]
        }));

        // Set Recommendation Review Lambda
        var setRecommendationReviewLambdaConstruct = new NodejsLambdaFunction(this, "SetRecommendationReviewFunction", new NodejsLambdaFunctionProps
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
        var tokenRefreshNotificationLambdaConstruct = new NodejsLambdaFunction(this, "AppleMusicApiTokenRefreshNotificationLambda", new NodejsLambdaFunctionProps
        {
            Handler = "token-refresh-notification.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/event-handlers"),
            Role = tokenRefreshNotificationLambdaRole,
            Description = "Sends notifications when Apple Music API token needs to be refreshed",
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["ADMIN_EMAIL"] = configuration["AppleMusicApi:Email:AdminEmail"]!,
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
        var checkPendingModerationsLambda = new NodejsLambdaFunction(this, "CheckPendingModerationsFunction", new NodejsLambdaFunctionProps
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
        var nodejsResource = new ApiGatewayResource(this, "NodejsResource", new ApiGatewayResourceProps
        {
            ParentResource = apiGateway.Root,
            PathPart = "nodejs"
        }).Resource;

        // Version 1 resource
        var version1Resource = new ApiGatewayResource(this, "Version1Resource", new ApiGatewayResourceProps
        {
            ParentResource = nodejsResource,
            PathPart = "v1"
        }).Resource;

        // Auth endpoint
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

        // Create integration for auth token
        var authIntegration = new ApiGatewayIntegration(this, "AuthIntegration", new ApiGatewayIntegrationProps
        {
            Function = nodejsAuthHandlerFunction
        });

        // Add method to token resource
        var getTokenMethod = new ApiGatewayMethod(this, "GetTokenMethod", new ApiGatewayMethodProps
        {
            Resource = tokenResource,
            HttpMethod = "GET",
            Integration = authIntegration.Integration
        });

        // Add history endpoints to API Gateway
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

        // Create integration for music history
        var musicHistoryIntegration = new ApiGatewayIntegration(this, "MusicHistoryIntegration", new ApiGatewayIntegrationProps
        {
            Function = getSongHistoryLambda
        });

        // Add method to music history resource
        var getMusicHistoryMethod = new ApiGatewayMethod(this, "GetMusicHistoryMethod", new ApiGatewayMethodProps
        {
            Resource = musicHistoryResource,
            HttpMethod = "GET",
            Integration = musicHistoryIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Add POST method for creating (single) recommendation
        var recommendationResource = new ApiGatewayResource(this, "RecommendationResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "recommendation"
        }).Resource;

        // Create integration for set recommendations
        var setRecommendationsIntegration = new ApiGatewayIntegration(this, "SetRecommendationsIntegration", new ApiGatewayIntegrationProps
        {
            Function = setRecommendationsLambda,
        });

        // Add method to recommendation resource
        var postRecommendationMethod = new ApiGatewayMethod(this, "PostRecommendationMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationResource,
            HttpMethod = "POST",
            Integration = setRecommendationsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Add GET method for retrieving (multiple) recommendations
        var recommendationsResource = new ApiGatewayResource(this, "RecommendationsResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "recommendations"
        }).Resource;

        // Create integration for get recommendations
        var getRecommendationsIntegration = new ApiGatewayIntegration(this, "GetRecommendationsIntegration", new ApiGatewayIntegrationProps
        {
            Function = getRecommendationsLambda
        });

        // Add method to recommendations resource
        var getRecommendationsMethod = new ApiGatewayMethod(this, "GetRecommendationsMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationsResource,
            HttpMethod = "GET",
            Integration = getRecommendationsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Add GET method for retrieving a single recommendation by ID
        var recommendationByIdResource = new ApiGatewayResource(this, "RecommendationByIdResource", new ApiGatewayResourceProps
        {
            ParentResource = recommendationsResource,
            PathPart = "{id}"
        }).Resource;

        // Add method to recommendation by id resource
        var getRecommendationByIdMethod = new ApiGatewayMethod(this, "GetRecommendationByIdMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationByIdResource,
            HttpMethod = "GET",
            Integration = getRecommendationsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Add GET method for retrieving notes for a specific recommendation
        var recommendationNotesResource = new ApiGatewayResource(this, "RecommendationNotesResource", new ApiGatewayResourceProps
        {
            ParentResource = recommendationByIdResource,
            PathPart = "notes"
        }).Resource;

        // Create integration for get recommendation notes
        var getRecommendationNotesIntegration = new ApiGatewayIntegration(this, "GetRecommendationNotesIntegration", new ApiGatewayIntegrationProps
        {
            Function = getRecommendationNotesLambda
        });

        // Add method to recommendation notes resource
        var getRecommendationNotesMethod = new ApiGatewayMethod(this, "GetRecommendationNotesMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationNotesResource,
            HttpMethod = "GET",
            Integration = getRecommendationNotesIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Create integration for set recommendation notes
        var setRecommendationNotesIntegration = new ApiGatewayIntegration(this, "SetRecommendationNotesIntegration", new ApiGatewayIntegrationProps
        {
            Function = setRecommendationNotesLambda
        });

        // Add method to recommendation notes resource
        var postRecommendationNotesMethod = new ApiGatewayMethod(this, "PostRecommendationNotesMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationNotesResource,
            HttpMethod = "POST",
            Integration = setRecommendationNotesIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Add GET method for retrieving reviews for a specific recommendation
        var recommendationReviewsResource = new ApiGatewayResource(this, "RecommendationReviewsResource", new ApiGatewayResourceProps
        {
            ParentResource = recommendationByIdResource,
            PathPart = "reviews"
        }).Resource;

        // Create integration for get recommendation reviews
        var getRecommendationReviewsIntegration = new ApiGatewayIntegration(this, "GetRecommendationReviewsIntegration", new ApiGatewayIntegrationProps
        {
            Function = getRecommendationReviewsLambda
        });

        // Add method to recommendation reviews resource
        var getRecommendationReviewsMethod = new ApiGatewayMethod(this, "GetRecommendationReviewsMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationReviewsResource,
            HttpMethod = "GET",
            Integration = getRecommendationReviewsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Create integration for set recommendation review
        var setRecommendationReviewIntegration = new ApiGatewayIntegration(this, "SetRecommendationReviewIntegration", new ApiGatewayIntegrationProps
        {
            Function = setRecommendationReviewLambda
        });

        // Add method to recommendation reviews resource
        var postRecommendationReviewMethod = new ApiGatewayMethod(this, "PostRecommendationReviewMethod", new ApiGatewayMethodProps
        {
            Resource = recommendationReviewsResource,
            HttpMethod = "POST",
            Integration = setRecommendationReviewIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Add GET method for retrieving all reviews
        var allReviewsResource = new ApiGatewayResource(this, "AllReviewsResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "reviews"
        }).Resource;

        // Add method to all reviews resource
        var getAllReviewsMethod = new ApiGatewayMethod(this, "GetAllReviewsMethod", new ApiGatewayMethodProps
        {
            Resource = allReviewsResource,
            HttpMethod = "GET",
            Integration = getRecommendationReviewsIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE
        });

        // Apple Music API endpoints
        var appleMusicResource = new ApiGatewayResource(this, "AppleMusicResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "apple-music"
        }).Resource;

        // Create integration for Apple Music API
        var appleMusicIntegration = new ApiGatewayIntegration(this, "AppleMusicIntegration", new ApiGatewayIntegrationProps
        {
            Function = dataFetchingLambda,
            Proxy = true,
            PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH
        });

        // Create proxy resource for Apple Music API
        var appleMusicProxyResource = new ApiGatewayProxyResource(this, "AppleMusicProxyResource", new ApiGatewayProxyResourceProps
        {
            ParentResource = appleMusicResource
        }).ProxyResource;

        // Add method to Apple Music proxy resource
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
            }
        });

        // MusicBrainz API endpoints
        var musicBrainzResource = new ApiGatewayResource(this, "MusicBrainzResource", new ApiGatewayResourceProps
        {
            ParentResource = version1Resource,
            PathPart = "musicbrainz"
        }).Resource;

        // Create integration for MusicBrainz API
        var musicBrainzIntegration = new ApiGatewayIntegration(this, "MusicBrainzIntegration", new ApiGatewayIntegrationProps
        {
            Function = musicBrainzDataFetchingLambda,
            Proxy = true,
            PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH
        });

        // Create proxy resource for MusicBrainz API
        var musicBrainzProxyResource = new ApiGatewayProxyResource(this, "MusicBrainzProxyResource", new ApiGatewayProxyResourceProps
        {
            ParentResource = musicBrainzResource
        }).ProxyResource;

        // Add method to MusicBrainz proxy resource
        var musicBrainzProxyMethod = new ApiGatewayMethod(this, "MusicBrainzProxyMethod", new ApiGatewayMethodProps
        {
            Resource = musicBrainzProxyResource,
            HttpMethod = "ANY",
            Integration = musicBrainzIntegration.Integration,
            AuthorizationType = AuthorizationType.NONE,
            ApiKeyRequired = false
        });

        // Add method to nodejs resource
        var nodejsProxyMethod = new ApiGatewayMethod(this, "NodejsProxyMethod", new ApiGatewayMethodProps
        {
            Resource = nodejsResource,
            HttpMethod = "ANY",
            Integration = appleMusicIntegration.Integration,
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

        #endregion
    }
}
