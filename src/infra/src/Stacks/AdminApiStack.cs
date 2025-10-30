using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Cognito;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Amazon.CDK.AWS.SSM;
using Cdklabs.CdkNag;
using Constructs;
using Microsoft.Extensions.Configuration;
using Music.Infra.Constructs;
using Music.Infra.Models.Settings;

namespace Music.Infra.Stacks;

/// <summary>
///     Defines the stack for the admin.music.mariolopez.org website.
///     This stack hosts the admin panel that allows managing Apple Music history data.
/// </summary>
public sealed class AdminApiStack : Stack
{
    internal AdminApiStack(Construct scope, string id, IStackProps? props = null, IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region SSM Parameters

        // Create SSM Parameter for storing Apple MUT
        var appleMusicUserTokenParameter = new StringParameter(this, "Music-AppleMusicUserTokenParameter",
            new StringParameterProps
            {
                ParameterName = "/Music/AdminPanel/Apple/MUT",
                Description = "Music User Token for accessing Apple Music data",
                StringValue = "placeholder" // Initial 'placeholder' value
            });

        // Create SSM Parameter for storing Spotify User Access Token (OAuth)
        var spotifyUserAccessTokenParameter = new StringParameter(this, "Music-SpotifyUserAccessTokenParameter",
            new StringParameterProps
            {
                ParameterName = "/Music/AdminPanel/Spotify/UserAccessToken",
                Description = "Spotify User Access Token from OAuth flow",
                StringValue = "placeholder" // Initial 'placeholder' value
            });

        // Create SSM Parameter for storing Spotify User Refresh Token (OAuth)
        var spotifyUserRefreshTokenParameter = new StringParameter(this, "Music-SpotifyUserRefreshTokenParameter",
            new StringParameterProps
            {
                ParameterName = "/Music/AdminPanel/Spotify/UserRefreshToken",
                Description = "Spotify User Refresh Token from OAuth flow",
                StringValue = "placeholder" // Initial 'placeholder' value
            });

        #endregion

        #region Secret

        var spotifyClientSecret = new Secret(this, "Music-SpotifyClientSecret", new SecretProps
        {
            SecretName = "SpotifyClientSecret",
            Description = "Contains both Client ID and Client Secret values for accessing Spotify API."
        });

        #endregion

        #region Cognito

        var userPool = new UserPool(this, "Music-AdminUserPool", new UserPoolProps
        {
            UserPoolName = "Music-AdminUserPool",
            SelfSignUpEnabled = false,
            SignInAliases = new SignInAliases
            {
                Username = true,
                Email = true
            },
            StandardAttributes = new StandardAttributes
            {
                Email = new StandardAttribute { Required = true, Mutable = true }
            },
            PasswordPolicy = new PasswordPolicy
            {
                MinLength = 12,
                RequireLowercase = true,
                RequireUppercase = true,
                RequireDigits = true,
                RequireSymbols = true
            },
            Mfa = Mfa.REQUIRED,
            MfaSecondFactor = new MfaSecondFactor
            {
                Sms = false,
                Otp = true,
                Email = false
            },
            FeaturePlan = FeaturePlan.PLUS,
            StandardThreatProtectionMode = StandardThreatProtectionMode.FULL_FUNCTION,
            AccountRecovery = AccountRecovery.EMAIL_ONLY,
            RemovalPolicy = RemovalPolicy.DESTROY,
            DeletionProtection = false
        });

        // Create Cognito User Pool Client
        var userPoolClient = userPool.AddClient("Music-AdminUserPoolClient", new UserPoolClientOptions
        {
            UserPoolClientName = "Music-AdminUserPoolClient",
            AuthFlows = new AuthFlow
            {
                UserPassword = true,
                UserSrp = true
            },
            PreventUserExistenceErrors = true,
            GenerateSecret = false
        });

        // Create a user in the pool (you'll need to set the password after deployment)
        var adminUser = new CfnUserPoolUser(this, "Music-AdminUser", new CfnUserPoolUserProps
        {
            UserPoolId = userPool.UserPoolId,
            Username = configuration?.GetValue<string>("AdminPanel:AdminUsername"),
            UserAttributes = new[]
            {
                new CfnUserPoolUser.AttributeTypeProperty
                {
                    Name = "email",
                    Value = configuration?.GetValue<string>("AdminPanel:AdminEmail")
                }
            }
        });

        // Create the Cognito authorizer
        var authorizer = new CognitoUserPoolsAuthorizer(this, "Music-AdminAuthorizer",
            new CognitoUserPoolsAuthorizerProps
            {
                CognitoUserPools = [userPool]
            });

        #endregion

        #region Lambda Functions

        #region Set Schedule Rate Lambda

        // Create Lambda function to update schedule rate
        var setScheduleRateV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-SetScheduleRateFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-schedule-rate.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/ScheduleRate"
                },
                Description = "Lambda function to update the Apple Music history job schedule rate (Version 1)",
                Role = new Role(this, "Music-SetScheduleRateFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var setScheduleRateV1Function = setScheduleRateV1FunctionConstruct.Function;

        // Grant Lambda permission to write to Parameter Store
        setScheduleRateV1Function.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/ScheduleRate"]
        }));

        #endregion

        #region Get Schedule Rate Lambda

        // Create Lambda function to get schedule rate
        var getScheduleRateV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-GetScheduleRateFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-schedule-rate.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/ScheduleRate"
                },
                Description = "Lambda function to get the Apple Music history job schedule rate (Version 1)",
                Role = new Role(this, "GetScheduleRateFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getScheduleRateV1Function = getScheduleRateV1FunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        getScheduleRateV1Function.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/ScheduleRate"]
        }));

        #endregion

        #region Set Song Limit Lambda

        // Create Lambda function to update song limit
        var setSongLimitV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-SetSongLimitFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-song-limit.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/SongLimit"
                },
                Description = "Lambda function to update the Apple Music history song limit (Version 1)",
                Role = new Role(this, "Music-SetSongLimitFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var setSongLimitV1Function = setSongLimitV1FunctionConstruct.Function;

        // Grant Lambda permissions
        setSongLimitV1Function.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/SongLimit"]
        }));

        #endregion

        #region Get Song Limit Lambda

        // Create Lambda function to get song limit
        var getSongLimitV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-GetSongLimitFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-song-limit.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/SongLimit"
                },
                Description = "Lambda function to get the Apple Music history song limit (Version 1)",
                Role = new Role(this, "Music-GetSongLimitFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getSongLimitV1Function = getSongLimitV1FunctionConstruct.Function;

        getSongLimitV1Function.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/SongLimit"]
        }));

        #endregion

        #region Set Apple Music User Token Lambda

        // Create Lambda function to update Apple Music User Token (AppleMUT)
        var setAppleMusicUserTokenV1FunctionConstruct = new NodejsLambdaFunction(this,
            "Music-SetAppleMusicUserTokenFunctionV1",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-apple-mut.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AdminPanel/Apple/MUT"
                },
                Description = "Lambda function to update Music User Token (Version 1)",
                Role = new Role(this, "Music-SetAppleMusicUserTokenFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var setAppleMusicUserTokenV1Function = setAppleMusicUserTokenV1FunctionConstruct.Function;

        // Grant Lambda permission to write to Parameter Store
        appleMusicUserTokenParameter.GrantWrite(setAppleMusicUserTokenV1Function);

        #endregion

        #region Get Apple Music User Token Lambda

        // Create Lambda function to read Apple MUT
        var getAppleMusicUserTokenV1FunctionConstruct = new NodejsLambdaFunction(this,
            "Music-GetAppleMusicUserTokenFunctionV1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-apple-mut.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AdminPanel/Apple/MUT"
                },
                Description = "Lambda function to retrieve Music User Token from Parameter Store (Version 1)",
                Role = new Role(this, "Music-GetAppleMusicUserTokenFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getAppleMusicUserTokenV1Function = getAppleMusicUserTokenV1FunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        appleMusicUserTokenParameter.GrantRead(getAppleMusicUserTokenV1Function);

        #endregion

        #region Get Apple Music User Token Authorization Status Lambda

        // Create Lambda function to check Apple MUT status
        var getAppleMusicUserTokenStatusV1FunctionConstruct = new NodejsLambdaFunction(this,
            "Music-GetAppleMusicUserTokenStatusFunctionV1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-apple-mut-status.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AdminPanel/Apple/MUT"
                },
                Description = "Lambda function to check Apple Music User Token authorization status (Version 1)",
                Role = new Role(this, "Music-GetAppleMusicUserTokenStatusFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getAppleMusicUserTokenStatusV1Function = getAppleMusicUserTokenStatusV1FunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        appleMusicUserTokenParameter.GrantRead(getAppleMusicUserTokenStatusV1Function);

        #endregion

        #region Get Spotify OAuth URL Lambda

        // Create Lambda function for Spotify OAuth URL generation
        var getSpotifyOAuthUrlV1FunctionConstruct = new NodejsLambdaFunction(this,
            "Music-GetSpotifyOAuthUrlFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-spotify-oauth-url.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["SPOTIFY_CLIENT_ID"] = spotifyClientSecret.SecretValueFromJson("client_id").UnsafeUnwrap(),
                    ["SPOTIFY_CLIENT_SECRET"] = spotifyClientSecret.SecretValueFromJson("client_secret").UnsafeUnwrap(),
                    ["SPOTIFY_REDIRECT_URI"] = "https://admin.music.mariolopez.org/api/nodejs/v1/spotify/oauth/callback"
                },
                Description = "Lambda function to generate Spotify OAuth authorization URL (Version 1)",
                Role = new Role(this, "Music-SpotifyOAuthUrlFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getSpotifyOAuthUrlV1Function = getSpotifyOAuthUrlV1FunctionConstruct.Function;

        // Grant Lambda permission to write PKCE parameters to Parameter Store
        getSpotifyOAuthUrlV1Function.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AdminPanel/Spotify/PKCE/*"]
        }));

        #endregion

        #region Get Spotify OAuth Callback URL Lambda

        // Create Lambda function for Spotify OAuth callback handling
        var getSpotifyOAuthCallbackV1FunctionConstruct = new NodejsLambdaFunction(this,
            "Music-GetSpotifyOAuthCallbackFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-spotify-oauth-callback.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["SPOTIFY_CLIENT_ID"] = spotifyClientSecret.SecretValueFromJson("client_id").UnsafeUnwrap(),
                    ["SPOTIFY_CLIENT_SECRET"] = spotifyClientSecret.SecretValueFromJson("client_secret").UnsafeUnwrap(),
                    ["SPOTIFY_REDIRECT_URI"] =
                        "https://admin.music.mariolopez.org/api/nodejs/v1/spotify/oauth/callback",
                    ["SPOTIFY_ACCESS_TOKEN_PARAMETER"] = "/Music/AdminPanel/Spotify/UserAccessToken",
                    ["SPOTIFY_REFRESH_TOKEN_PARAMETER"] = "/Music/AdminPanel/Spotify/UserRefreshToken",
                    ["ADMIN_PANEL_URL"] = "https://admin.music.mariolopez.org"
                },
                Description = "Lambda function to handle Spotify OAuth callback and store tokens (Version 1)",
                Role = new Role(this, "Music-SpotifyOAuthCallbackFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getSpotifyOAuthCallbackV1Function = getSpotifyOAuthCallbackV1FunctionConstruct.Function;

        // Grant Lambda permission to write to Spotify Parameter Store parameters
        spotifyUserAccessTokenParameter.GrantWrite(getSpotifyOAuthCallbackV1Function);
        spotifyUserRefreshTokenParameter.GrantWrite(getSpotifyOAuthCallbackV1Function);

        // Grant Lambda permission to read PKCE parameters from Parameter Store
        getSpotifyOAuthCallbackV1Function.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AdminPanel/Spotify/PKCE/*"]
        }));

        #endregion

        #region Get Spotify Authorization Status Lambda

        // Create Lambda function for checking Spotify OAuth status
        var getSpotifyAuthorizationStatusV1FunctionConstruct = new NodejsLambdaFunction(this,
            "Music-GetSpotifyAuthorizationStatusFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-spotify-authorization-status.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["SPOTIFY_ACCESS_TOKEN_PARAMETER"] = "/Music/AdminPanel/Spotify/UserAccessToken"
                },
                Description = "Lambda function to check Spotify OAuth authorization status (Version 1)",
                Role = new Role(this, "Music-SpotifyStatusFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getSpotifyAuthorizationStatusV1Function = getSpotifyAuthorizationStatusV1FunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        spotifyUserAccessTokenParameter.GrantRead(getSpotifyAuthorizationStatusV1Function);

        #endregion

        #region Get Spotify Token Lambda

        // Create Lambda function for retrieving Spotify access token
        var getSpotifyTokenV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-GetSpotifyTokenFunction_V1",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-spotify-token.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["SPOTIFY_ACCESS_TOKEN_PARAMETER"] = "/Music/AdminPanel/Spotify/UserAccessToken"
                },
                Description = "Lambda function to retrieve Spotify access token from Parameter Store (Version 1)",
                Role = new Role(this, "Music-GetSpotifyTokenFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getSpotifyTokenV1Function = getSpotifyTokenV1FunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        spotifyUserAccessTokenParameter.GrantRead(getSpotifyTokenV1Function);

        #endregion

        #endregion

        #region API Gateway Integrations

        var getScheduleRateV1Integration = new ApiGatewayIntegration(this,
            "Music-GetScheduleRateV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getScheduleRateV1Function
            });

        var updateScheduleRateV1Integration = new ApiGatewayIntegration(this,
            "Music-UpdateScheduleRateV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = setScheduleRateV1Function
            });

        var getSongLimitV1Integration = new ApiGatewayIntegration(this,
            "Music-GetSongLimitV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getSongLimitV1Function
            });

        var updateSongLimitV1Integration = new ApiGatewayIntegration(this,
            "Music-UpdateSongLimitV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = setSongLimitV1Function
            });

        var getAppleMusicUserTokenV1Integration = new ApiGatewayIntegration(this,
            "Music-GetAppleMusicUserTokenV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getAppleMusicUserTokenV1Function
            });

        var getAppleMusicUserTokenStatusV1Integration = new ApiGatewayIntegration(this,
            "Music-GetAppleMusicUserTokenStatusV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getAppleMusicUserTokenStatusV1Function
            });

        var updateAppleMusicUserTokenV1Integration = new ApiGatewayIntegration(this,
            "Music-UpdateAppleMusicUserTokenV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = setAppleMusicUserTokenV1Function
            });

        var getSpotifyOAuthUrlV1Integration = new ApiGatewayIntegration(this,
            "Music-GetSpotifyOAuthUrlV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getSpotifyOAuthUrlV1Function
            });

        var getSpotifyOAuthCallbackV1Integration = new ApiGatewayIntegration(this,
            "Music-SpotifyOAuthCallbackV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getSpotifyOAuthCallbackV1Function
            });

        var getSpotifyAuthorizationStatusV1Integration = new ApiGatewayIntegration(this,
            "Music-GetSpotifyAuthorizationStatusV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getSpotifyAuthorizationStatusV1Function
            });

        var getSpotifyTokenV1Integration = new ApiGatewayIntegration(this,
            "Music-GetSpotifyTokenV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getSpotifyTokenV1Function
            });

        #endregion

        #region API Gateway

        // TODO: Add this back at some point... (?)
        // var corsSettings = configuration?.GetSection("AdminApiSettings").Get<AdminApiSettings>();

        // Certificate for `*.music.mariolopez.org`
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-AdminSiteCertificate", rootCertificateArn!);

        var restApiGateway = new RestApi(this, "Music-AdminApi", new RestApiProps
        {
            RestApiName = "Music Admin API Gateway",
            Description = "API for managing various settings for `music.mariolopez.org`",
            DomainName = new DomainNameOptions
            {
                DomainName = "admin.music.mariolopez.org",
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
                    "X-Amz-Security-Token"
                ],
                AllowMethods = Cors.ALL_METHODS,
                AllowOrigins = Cors.ALL_ORIGINS
            },
            CloudWatchRole = true
        });

        #region API Gateway Resources

        var nodejsResource = new ApiGatewayResource(this,
            "Music-NodejsResource",
            new ApiGatewayResourceProps
            {
                ParentResource = restApiGateway.Root,
                PathPart = "nodejs"
            }).Resource;

        var v1Resource = new ApiGatewayResource(this,
            "Music-V1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = nodejsResource,
                PathPart = "v1"
            }).Resource;

        var scheduleV1Resource = new ApiGatewayResource(this,
            "Music-ScheduleV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = v1Resource,
                PathPart = "schedule"
            }).Resource;

        var songLimitV1Resource = new ApiGatewayResource(this,
            "Music-SongLimitV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = v1Resource,
                PathPart = "song-limit"
            }).Resource;

        var appleV1Resource = new ApiGatewayResource(this,
            "Music-AppleV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = v1Resource,
                PathPart = "apple"
            }).Resource;

        var appleMusicUserTokenV1Resource = new ApiGatewayResource(this,
            "Music-AppleMusicUserTokenV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = appleV1Resource,
                PathPart = "mut"
            }).Resource;

        var appleMusicUserTokenStatusV1Resource = new ApiGatewayResource(this,
            "Music-AppleMusicUserTokenStatusV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = appleMusicUserTokenV1Resource,
                PathPart = "status"
            }).Resource;

        var spotifyV1Resource = new ApiGatewayResource(this,
            "Music-SpotifyV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = v1Resource,
                PathPart = "spotify"
            }).Resource;

        var spotifyOAuthV1Resource = new ApiGatewayResource(this,
            "Music-SpotifyOAuthV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = spotifyV1Resource,
                PathPart = "oauth"
            }).Resource;

        var spotifyOAuthUrlV1Resource = new ApiGatewayResource(this,
            "Music-SpotifyOAuthUrlV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = spotifyOAuthV1Resource,
                PathPart = "url"
            }).Resource;

        var spotifyOAuthCallbackV1Resource = new ApiGatewayResource(this,
            "Music-SpotifyOAuthCallbackV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = spotifyOAuthV1Resource,
                PathPart = "callback"
            }).Resource;

        var spotifyStatusV1Resource = new ApiGatewayResource(this,
            "Music-SpotifyStatusV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = spotifyV1Resource,
                PathPart = "status"
            }).Resource;

        var getSpotifyTokenV1Resource = new ApiGatewayResource(this,
            "Music-GetSpotifyTokenV1Resource",
            new ApiGatewayResourceProps
            {
                ParentResource = spotifyV1Resource,
                PathPart = "token"
            }).Resource;

        #endregion

        #region API Gateway Methods

        var requestValidator = new RequestValidator(this,
            "Music-AdminApiRequestValidator",
            new RequestValidatorProps
            {
                RestApi = restApiGateway,
                ValidateRequestBody = true,
                ValidateRequestParameters = true
            });

        var getScheduleV1Method = new ApiGatewayMethod(this,
            "Music-GetScheduleV1Method",
            new ApiGatewayMethodProps
            {
                Resource = scheduleV1Resource,
                HttpMethod = "GET",
                Integration = getScheduleRateV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var updateScheduleV1Method = new ApiGatewayMethod(this,
            "Music-UpdateScheduleV1Method",
            new ApiGatewayMethodProps
            {
                Resource = scheduleV1Resource,
                HttpMethod = "POST",
                Integration = updateScheduleRateV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getSongLimitV1Method = new ApiGatewayMethod(this,
            "Music-GetSongLimitV1Method",
            new ApiGatewayMethodProps
            {
                Resource = songLimitV1Resource,
                HttpMethod = "GET",
                Integration = getSongLimitV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var updateSongLimitV1Method = new ApiGatewayMethod(this,
            "Music-UpdateSongLimitV1Method",
            new ApiGatewayMethodProps
            {
                Resource = songLimitV1Resource,
                HttpMethod = "POST",
                Integration = updateSongLimitV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getAppleMutV1Method = new ApiGatewayMethod(this,
            "Music-GetAppleMutV1Method",
            new ApiGatewayMethodProps
            {
                Resource = appleMusicUserTokenV1Resource,
                HttpMethod = "GET",
                Integration = getAppleMusicUserTokenV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getAppleMutStatusV1Method = new ApiGatewayMethod(this,
            "Music-GetAppleMutStatusV1Method",
            new ApiGatewayMethodProps
            {
                Resource = appleMusicUserTokenStatusV1Resource,
                HttpMethod = "GET",
                Integration = getAppleMusicUserTokenStatusV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var updateAppleMutV1Method = new ApiGatewayMethod(this,
            "Music-UpdateAppleMutV1Method",
            new ApiGatewayMethodProps
            {
                Resource = appleMusicUserTokenV1Resource,
                HttpMethod = "POST",
                Integration = updateAppleMusicUserTokenV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getSpotifyOAuthUrlV1Method = new ApiGatewayMethod(this,
            "Music-GetSpotifyOAuthUrlV1Method",
            new ApiGatewayMethodProps
            {
                Resource = spotifyOAuthUrlV1Resource,
                HttpMethod = "GET",
                Integration = getSpotifyOAuthUrlV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getSpotifyOAuthCallbackV1Method = new ApiGatewayMethod(this,
            "Music-GetSpotifyOAuthCallbackV1Method",
            new ApiGatewayMethodProps
            {
                Resource = spotifyOAuthCallbackV1Resource,
                HttpMethod = "GET",
                Integration = getSpotifyOAuthCallbackV1Integration.Integration,
                AuthorizationType =
                    AuthorizationType.NONE, // OAuth callback doesn't need authentication during the flow
                RequestValidator = requestValidator
            });

        var getSpotifyStatusV1Method = new ApiGatewayMethod(this,
            "Music-GetSpotifyStatusV1Method",
            new ApiGatewayMethodProps
            {
                Resource = spotifyStatusV1Resource,
                HttpMethod = "GET",
                Integration = getSpotifyAuthorizationStatusV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getSpotifyTokenV1Method = new ApiGatewayMethod(this,
            "Music-GetSpotifyTokenV1Method",
            new ApiGatewayMethodProps
            {
                Resource = getSpotifyTokenV1Resource,
                HttpMethod = "GET",
                Integration = getSpotifyTokenV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        #endregion

        #endregion

        #region Outputs

        var apiDomainName = new CfnOutput(this, "Music-AdminApiGatewayCustomDomainName", new CfnOutputProps
        {
            Value = restApiGateway.DomainName!.DomainNameAliasDomainName,
            ExportName = "Music-AdminApiGatewayCustomDomainName"
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
                Id = "AwsSolutions-APIG6",
                Reason = "Logging is relatively expensive. Will enable when needed for debugging."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-SMG4",
                Reason = "This secret will soon be an SSM Parameter."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-APIG4",
                Reason = "(Relates to Callback URL Endpoint) This is a public API."
            },
            new NagPackSuppression
            {
                Id = "AwsSolutions-COG4",
                Reason = "(Relates to Callback URL Endpoint) This is a public API."
            }
        ]);

        #endregion
    }
}
