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

        // Create Lambda function to store MUT
        var storeMutFunction = new Function(this, "Music-StoreMutFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/store-mut/store-mut-nodejs/dist"),
            Environment = new Dictionary<string, string>
            {
                { "PARAMETER_NAME", mutParameter.ParameterName }
            },
            Description = "Lambda function to store Music User Token in Parameter Store",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
        });

        // Grant Lambda permission to write to Parameter Store
        mutParameter.GrantWrite(storeMutFunction);

        // Create Lambda function to read MUT
        var getMutFunction = new Function(this, "Music-GetMutFunction", new FunctionProps
        {
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Code = Code.FromAsset("../app/backend/handlers/get-mut/get-mut-nodejs/dist"),
            Environment = new Dictionary<string, string>
            {
                { "PARAMETER_NAME", mutParameter.ParameterName }
            },
            Description = "Lambda function to retrieve Music User Token from Parameter Store",
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
        });

        // Grant Lambda permission to read from Parameter Store
        mutParameter.GrantRead(getMutFunction);

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
        new BucketDeployment(this, "Music-DeployAdminSite", new BucketDeploymentProps
        {
            Sources = [Source.Asset("../app/frontend/music-admin-panel/music-admin-panel-react/dist")],
            DestinationBucket = adminBucket
        });

        #endregion

        #region Distribution

        // Certificate for `*.music.mariolopez.org`
        // TODO: Remove this hard-coded ARN - use the same certificate as the main site
        var rootCertificateArn = "arn:aws:acm:us-east-1:851725225504:certificate/70d15630-f6b4-495e-9d0c-572c64804dfc";
        var rootCertificate = Certificate.FromCertificateArn(this, "Music-AdminSiteCertificate", rootCertificateArn);

        // Import the API Gateway's custom domain name
        var importedApiDomainName = Fn.ImportValue("Music-ApiGatewayCustomDomainName");

        // Create CloudFront distribution for the admin panel
        var distribution = new Distribution(this, "Music-AdminSiteDistribution", new DistributionProps
        {
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
        var nodejsMutResource = api.Root.AddResource("nodejs").AddResource("mut");

        // POST /api/nodejs/mut/store
        nodejsMutResource.AddResource("store").AddMethod(
            "POST",
            new LambdaIntegration(storeMutFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        // GET /api/nodejs/mut/get
        nodejsMutResource.AddResource("get").AddMethod(
            "GET",
            new LambdaIntegration(getMutFunction, new LambdaIntegrationOptions
            {
                Timeout = Duration.Seconds(29),
                AllowTestInvoke = true
            })
        );

        #endregion

        // Output Cognito configuration for frontend
        new CfnOutput(this, "UserPoolId", new CfnOutputProps
        {
            Value = userPool.UserPoolId,
            Description = "Cognito User Pool ID"
        });

        new CfnOutput(this, "UserPoolClientId", new CfnOutputProps
        {
            Value = userPoolClient.UserPoolClientId,
            Description = "Cognito User Pool Client ID"
        });

        new CfnOutput(this, "UserPoolDomain", new CfnOutputProps
        {
            Value = $"admin-{this.Account}.auth.{this.Region}.amazoncognito.com",
            Description = "Cognito User Pool Domain"
        });
    }
}
