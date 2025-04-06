using Amazon.CDK;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.SSM;
using Constructs;
using System.Collections.Generic;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Cognito;
using Microsoft.Extensions.Configuration;
using Music.Infra.Models.Settings;
using Music.Infra.Constructs;
using Amazon.CDK.AWS.IAM;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the admin.music.mariolopez.org website.
/// This stack hosts the admin panel that allows managing Apple Music history data.
/// </summary>
public class AdminPanelStack : Stack
{
    internal AdminPanelStack(Construct scope, string id, IStackProps? props = null, IConfiguration? configuration = null)
        : base(scope, id, props)
    {
        #region Cognito

        // Create Cognito User Pool
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
        var authorizer = new CognitoUserPoolsAuthorizer(this, "AdminAuthorizer", new CognitoUserPoolsAuthorizerProps
        {
            CognitoUserPools = [userPool]
        });

        #endregion

        #region SSM Parameter

        // Create SSM Parameter for storing MUT
        var mutParameter = new StringParameter(this, "Music-MutParameter", new StringParameterProps
        {
            ParameterName = "/Music/AdminPanel/MUT",
            Description = "Music User Token for accessing Apple Music data",
            StringValue = "placeholder", // Initial 'placeholder' value
        });

        #endregion

        #region Lambda Functions

        #region Set MUT Lambda

        // Create Lambda function to update MUT
        var updateMutFunctionConstruct = new NodejsLambdaFunction(this, "Music-UpdateMutFunction", new NodejsLambdaFunctionProps
        {
            Handler = "update-mut.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = mutParameter.ParameterName
            },
            Description = "Lambda function to update Music User Token",
            Role = new Role(this, "Music-UpdateMutFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            })
        });
        var updateMutFunction = updateMutFunctionConstruct.Function;

        // Grant Lambda permission to write to Parameter Store
        mutParameter.GrantWrite(updateMutFunction);

        #endregion

        #region Get MUT Lambda

        // Create Lambda function to read MUT
        var getMutFunctionConstruct = new NodejsLambdaFunction(this, "Music-GetMutFunction", new NodejsLambdaFunctionProps
        {
            Handler = "get-mut.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = mutParameter.ParameterName
            },
            Description = "Lambda function to retrieve Music User Token from Parameter Store",
            Role = new Role(this, "Music-GetMutFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            })
        });
        var getMutFunction = getMutFunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        mutParameter.GrantRead(getMutFunction);

        #endregion

        #region Set Schedule Rate Lambda

        // Create Lambda function to update schedule rate
        var updateScheduleRateFunctionConstruct = new NodejsLambdaFunction(this, "Music-UpdateScheduleRateFunction", new NodejsLambdaFunctionProps
        {
            Handler = "update-schedule-rate.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/ScheduleRate"
            },
            Description = "Lambda function to update the Apple Music history job schedule rate",
            Role = new Role(this, "Music-UpdateScheduleRateFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            })
        });
        var updateScheduleRateFunction = updateScheduleRateFunctionConstruct.Function;

        #endregion

        #region Get Schedule Rate Lambda

        // Grant Lambda permission to write to Parameter Store
        updateScheduleRateFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/ScheduleRate"]
        }));

        // Create Lambda function to get schedule rate
        var getScheduleRateFunctionConstruct = new NodejsLambdaFunction(this, "Music-GetScheduleRateFunction", new NodejsLambdaFunctionProps
        {
            Handler = "get-schedule-rate.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/ScheduleRate"
            },
            Description = "Lambda function to get the Apple Music history job schedule rate",
            Role = new Role(this, "Music-GetScheduleRateFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            })
        });
        var getScheduleRateFunction = getScheduleRateFunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        getScheduleRateFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/ScheduleRate"]
        }));

        #endregion

        #region Set Song Limit Lambda

        // Create Lambda function to update song limit
        var updateSongLimitFunctionConstruct = new NodejsLambdaFunction(this, "Music-UpdateSongLimitFunction", new NodejsLambdaFunctionProps
        {
            Handler = "update-song-limit.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/SongLimit"
            },
            Description = "Lambda function to update the Apple Music history song limit",
            Role = new Role(this, "Music-UpdateSongLimitFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            })
        });
        var updateSongLimitFunction = updateSongLimitFunctionConstruct.Function;

        // Grant Lambda permissions
        updateSongLimitFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/SongLimit"]
        }));

        #endregion

        #region Get Song Limit Lambda

        // Create Lambda function to get song limit
        var getSongLimitFunctionConstruct = new NodejsLambdaFunction(this, "Music-GetSongLimitFunction", new NodejsLambdaFunctionProps
        {
            Handler = "get-song-limit.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/SongLimit"
            },
            Description = "Lambda function to get the Apple Music history song limit",
            Role = new Role(this, "Music-GetSongLimitFunctionRole", new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
            })
        });
        var getSongLimitFunction = getSongLimitFunctionConstruct.Function;

        getSongLimitFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/SongLimit"]
        }));

        #endregion

        #endregion

        #region Bucket

        // Create an S3 bucket configured for website hosting
        var adminBucket = new Bucket(this, "Music-AdminAssets", new BucketProps
        {
            WebsiteIndexDocument = "index.html",
            WebsiteErrorDocument = "error.html",
            PublicReadAccess = true,
            RemovalPolicy = RemovalPolicy.DESTROY,
            BlockPublicAccess = new BlockPublicAccess(new BlockPublicAccessOptions { BlockPublicPolicy = false })
        });

        #endregion

        #region Site Deployment

        // Deploy admin panel static site assets
        var deployAdminSite = new BucketDeployment(this, "Music-DeployAdminSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-admin-panel/music-admin-panel-react/dist")],
            DestinationBucket = adminBucket
        });

        #endregion

        #region Distribution

        // Certificate for `*.music.mariolopez.org`
        var awsSettings = configuration?.GetSection("AWS").Get<AwsSettings>();
        var rootCertificateArn = awsSettings?.CertificateArn;
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-AdminSiteCertificate", rootCertificateArn!);

        // Import the API Gateway's custom domain name
        var importedApiDomainName = Fn.ImportValue("Music-ApiGatewayCustomDomainName");

        // Create CloudFront distribution for the admin panel
        var distribution = new Distribution(this, "Music-AdminSiteDistribution", new DistributionProps
        {
            // Distribution serving the admin panel frontend for music.mariolopez.org
            DefaultBehavior = new BehaviorOptions
            {
                Origin = new S3StaticWebsiteOrigin(adminBucket),
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                // Disable caching during development
                CachePolicy = CachePolicy.CACHING_DISABLED
            },
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
                // API Path: Proxy to the API Gateway
                ["/api/*"] = new BehaviorOptions
                {
                    Origin = new HttpOrigin(importedApiDomainName, new HttpOriginProps
                    {
                        ProtocolPolicy = OriginProtocolPolicy.HTTPS_ONLY
                    }),
                    ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    CachePolicy = CachePolicy.CACHING_DISABLED,
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER,
                    AllowedMethods = AllowedMethods.ALLOW_ALL,
                }
            },
            Certificate = rootCertificate,
            DomainNames = ["admin.music.mariolopez.org"]
        });

        #endregion

        #region API Gateway

        var corsSettings = configuration?.GetSection("AdminApiSettings").Get<AdminApiSettings>();

        var api = new RestApi(this, "Music-AdminApi", new RestApiProps
        {
            RestApiName = "Music Admin API Gateway",
            Description = "API for managing Music User Token",
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
                AllowHeaders = [
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token"
                ],
                AllowMethods = ["GET", "POST", "OPTIONS"],
                AllowOrigins = corsSettings?.AllowedOrigins!
            }
        });

        #region API Gateway Resources

        var nodejsResource = new ApiGatewayResource(this, "NodejsResource", new ApiGatewayResourceProps
        {
            ParentResource = api.Root,
            PathPart = "nodejs"
        }).Resource;

        var mutResource = new ApiGatewayResource(this, "MutResource", new ApiGatewayResourceProps
        {
            ParentResource = nodejsResource,
            PathPart = "mut"
        }).Resource;

        var updateMutResource = new ApiGatewayResource(this, "UpdateMutResource", new ApiGatewayResourceProps
        {
            ParentResource = mutResource,
            PathPart = "update"
        }).Resource;

        var getMutResource = new ApiGatewayResource(this, "GetMutResource", new ApiGatewayResourceProps
        {
            ParentResource = mutResource,
            PathPart = "get"
        }).Resource;

        var scheduleResource = new ApiGatewayResource(this, "ScheduleResource", new ApiGatewayResourceProps
        {
            ParentResource = nodejsResource,
            PathPart = "schedule"
        }).Resource;

        var updateScheduleResource = new ApiGatewayResource(this, "UpdateScheduleResource", new ApiGatewayResourceProps
        {
            ParentResource = scheduleResource,
            PathPart = "update"
        }).Resource;

        var getScheduleResource = new ApiGatewayResource(this, "GetScheduleResource", new ApiGatewayResourceProps
        {
            ParentResource = scheduleResource,
            PathPart = "get"
        }).Resource;

        var songLimitResource = new ApiGatewayResource(this, "SongLimitResource", new ApiGatewayResourceProps
        {
            ParentResource = nodejsResource,
            PathPart = "song-limit"
        }).Resource;

        var updateSongLimitResource = new ApiGatewayResource(this, "UpdateSongLimitResource", new ApiGatewayResourceProps
        {
            ParentResource = songLimitResource,
            PathPart = "update"
        }).Resource;

        var getSongLimitResource = new ApiGatewayResource(this, "GetSongLimitResource", new ApiGatewayResourceProps
        {
            ParentResource = songLimitResource,
            PathPart = "get"
        }).Resource;

        #endregion

        #region API Gateway Integrations

        var updateMutIntegration = new ApiGatewayIntegration(this, "UpdateMutIntegration", new ApiGatewayIntegrationProps
        {
            Function = updateMutFunction,
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        });

        var getMutIntegration = new ApiGatewayIntegration(this, "GetMutIntegration", new ApiGatewayIntegrationProps
        {
            Function = getMutFunction,
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        });

        var updateScheduleRateIntegration = new ApiGatewayIntegration(this, "UpdateScheduleRateIntegration", new ApiGatewayIntegrationProps
        {
            Function = updateScheduleRateFunction,
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        });

        var getScheduleRateIntegration = new ApiGatewayIntegration(this, "GetScheduleRateIntegration", new ApiGatewayIntegrationProps
        {
            Function = getScheduleRateFunction,
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        });

        var updateSongLimitIntegration = new ApiGatewayIntegration(this, "UpdateSongLimitIntegration", new ApiGatewayIntegrationProps
        {
            Function = updateSongLimitFunction,
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        });

        var getSongLimitIntegration = new ApiGatewayIntegration(this, "GetSongLimitIntegration", new ApiGatewayIntegrationProps
        {
            Function = getSongLimitFunction,
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        });

        #endregion

        #region API Gateway Methods

        var updateMutMethod = new ApiGatewayMethod(this, "UpdateMutMethod", new ApiGatewayMethodProps
        {
            Resource = updateMutResource,
            HttpMethod = "POST",
            Integration = updateMutIntegration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer
        });

        var getMutMethod = new ApiGatewayMethod(this, "GetMutMethod", new ApiGatewayMethodProps
        {
            Resource = getMutResource,
            HttpMethod = "GET",
            Integration = getMutIntegration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer
        });

        var getScheduleMethod = new ApiGatewayMethod(this, "GetScheduleMethod", new ApiGatewayMethodProps
        {
            Resource = getScheduleResource,
            HttpMethod = "GET",
            Integration = getScheduleRateIntegration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer
        });

        var updateScheduleMethod = new ApiGatewayMethod(this, "UpdateScheduleMethod", new ApiGatewayMethodProps
        {
            Resource = updateScheduleResource,
            HttpMethod = "POST",
            Integration = updateScheduleRateIntegration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer
        });

        var updateSongLimitMethod = new ApiGatewayMethod(this, "UpdateSongLimitMethod", new ApiGatewayMethodProps
        {
            Resource = updateSongLimitResource,
            HttpMethod = "POST",
            Integration = updateSongLimitIntegration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer
        });

        var getSongLimitMethod = new ApiGatewayMethod(this, "GetSongLimitMethod", new ApiGatewayMethodProps
        {
            Resource = getSongLimitResource,
            HttpMethod = "GET",
            Integration = getSongLimitIntegration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer
        });

        #endregion

        #endregion

        #region Outputs

        // Output Cognito configuration for frontend
        var userPoolIdOutput = new CfnOutput(this, "UserPoolId", new CfnOutputProps
        {
            Value = userPool.UserPoolId,
            Description = "Cognito User Pool ID"
        });

        var userPoolClientIdOutput = new CfnOutput(this, "UserPoolClientId", new CfnOutputProps
        {
            Value = userPoolClient.UserPoolClientId,
            Description = "Cognito User Pool Client ID"
        });

        var userPoolDomainOutput = new CfnOutput(this, "UserPoolDomain", new CfnOutputProps
        {
            Value = $"admin-{Account}.auth.{Region}.amazoncognito.com",
            Description = "Cognito User Pool Domain"
        });

        #endregion
    }
}
