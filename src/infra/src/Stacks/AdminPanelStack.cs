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

using Function = Amazon.CDK.AWS.Lambda.Function;
using FunctionProps = Amazon.CDK.AWS.Lambda.FunctionProps;
using Amazon.CDK.AWS.IAM;

namespace Music.Infra.Stacks;

/// <summary>
/// Defines the stack for the admin.music.mariolopez.org website.
/// This stack hosts the admin panel that allows managing Apple Music history data.
/// </summary>
public class AdminPanelStack : Stack
{
    internal AdminPanelStack(Construct scope, string id, IStackProps props = null, IConfiguration configuration = null)
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

        // Create Lambda function to update MUT
        var updateMutFunction = new Function(this, "Music-UpdateMutFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "update-mut.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = mutParameter.ParameterName
            },
            Description = "Lambda function to update Music User Token",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
            Tracing = Tracing.ACTIVE
        });

        // Grant Lambda permission to write to Parameter Store
        mutParameter.GrantWrite(updateMutFunction);

        // Create Lambda function to read MUT
        var getMutFunction = new Function(this, "Music-GetMutFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-mut.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = mutParameter.ParameterName
            },
            Description = "Lambda function to retrieve Music User Token from Parameter Store",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
            Tracing = Tracing.ACTIVE
        });

        // Grant Lambda permission to read from Parameter Store
        mutParameter.GrantRead(getMutFunction);

        // Create Lambda function to update schedule rate
        var updateScheduleRateFunction = new Function(this, "Music-UpdateScheduleRateFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "update-schedule-rate.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/ScheduleRate"
            },
            Description = "Lambda function to update the Apple Music history tracking schedule rate",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Tracing = Tracing.ACTIVE
        });

        // Grant Lambda permission to write to Parameter Store
        updateScheduleRateFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/ScheduleRate"]
        }));

        // Create Lambda function to get schedule rate
        var getScheduleRateFunction = new Function(this, "Music-GetScheduleRateFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-schedule-rate.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/ScheduleRate"
            },
            Description = "Lambda function to get the Apple Music history tracking schedule rate",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Tracing = Tracing.ACTIVE
        });

        // Grant Lambda permission to read from Parameter Store
        getScheduleRateFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/ScheduleRate"]
        }));

        // Create Lambda function to update track limit
        var updateTrackLimitFunction = new Function(this, "Music-UpdateTrackLimitFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "update-track-limit.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/TrackLimit"
            },
            Description = "Lambda function to update the Apple Music history tracking track limit",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Tracing = Tracing.ACTIVE
        });

        // Create Lambda function to get track limit
        var getTrackLimitFunction = new Function(this, "Music-GetTrackLimitFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "get-track-limit.handler",
            Code = Code.FromAsset("../app/backend/dist/handlers/api/admin"),
            Environment = new Dictionary<string, string>
            {
                ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                ["PARAMETER_NAME"] = "/Music/AppleMusicHistory/TrackLimit"
            },
            Description = "Lambda function to get the Apple Music history tracking track limit",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            Timeout = Duration.Seconds(29),
            Tracing = Tracing.ACTIVE
        });

        // Grant Lambda permissions
        updateTrackLimitFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:PutParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/TrackLimit"]
        }));

        getTrackLimitFunction.AddToRolePolicy(new PolicyStatement(new PolicyStatementProps
        {
            Effect = Effect.ALLOW,
            Actions = ["ssm:GetParameter"],
            Resources = [$"arn:aws:ssm:{Region}:{Account}:parameter/Music/AppleMusicHistory/TrackLimit"]
        }));

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
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-AdminSiteCertificate", rootCertificateArn);

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

        // Create REST API with Cognito Authorizer
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
            DefaultMethodOptions = new MethodOptions
            {
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = new CognitoUserPoolsAuthorizer(this, "Music-AdminAuthorizer", new CognitoUserPoolsAuthorizerProps
                {
                    CognitoUserPools = [userPool]
                })
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
                AllowOrigins = corsSettings?.AllowedOrigins
            }
        });

        // Create API resources and methods
        var nodejsResource = api.Root.AddResource("nodejs");
        var mutResource = nodejsResource.AddResource("mut");

        // POST /api/nodejs/mut/update
        mutResource.AddResource("update").AddMethod(
            "POST",
            new LambdaIntegration(updateMutFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        // GET /api/nodejs/mut/get
        mutResource.AddResource("get").AddMethod(
            "GET",
            new LambdaIntegration(getMutFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        // POST /api/nodejs/schedule/update
        var scheduleResource = nodejsResource.AddResource("schedule");
        scheduleResource.AddResource("update").AddMethod(
            "POST",
            new LambdaIntegration(updateScheduleRateFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        // GET /api/nodejs/schedule/get
        scheduleResource.AddResource("get").AddMethod(
            "GET",
            new LambdaIntegration(getScheduleRateFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        // Add track limit endpoints
        var trackLimitResource = nodejsResource.AddResource("track-limit");
        trackLimitResource.AddResource("update").AddMethod(
            "POST",
            new LambdaIntegration(updateTrackLimitFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        trackLimitResource.AddResource("get").AddMethod(
            "GET",
            new LambdaIntegration(getTrackLimitFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

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
            Value = $"admin-{this.Account}.auth.{this.Region}.amazoncognito.com",
            Description = "Cognito User Pool Domain"
        });

        #endregion
    }
}
