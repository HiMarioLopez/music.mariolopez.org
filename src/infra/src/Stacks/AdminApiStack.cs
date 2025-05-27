using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.Cognito;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
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
        #region SSM Parameter

        // Create SSM Parameter for storing MUT
        var mutParameter = new StringParameter(this, "Music-MutParameter", new StringParameterProps
        {
            ParameterName = "/Music/AdminPanel/MUT",
            Description = "Music User Token for accessing Apple Music data",
            StringValue = "placeholder" // Initial 'placeholder' value
        });

        #endregion

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

        #region Set MUT Lambda

        // Create Lambda function to update MUT
        var setMutV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-SetMutFunctionV1",
            new NodejsLambdaFunctionProps
            {
                Handler = "set-mut.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AdminPanel/MUT"
                },
                Description = "Lambda function to update Music User Token (Version 1)",
                Role = new Role(this, "Music-SetMutFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var setMutV1Function = setMutV1FunctionConstruct.Function;

        // Grant Lambda permission to write to Parameter Store
        mutParameter.GrantWrite(setMutV1Function);

        #endregion

        #region Get MUT Lambda

        // Create Lambda function to read MUT
        var getMutV1FunctionConstruct = new NodejsLambdaFunction(this, "Music-GetMutFunction",
            new NodejsLambdaFunctionProps
            {
                Handler = "get-mut.handler",
                Code = Code.FromAsset("../app/backend/dist/handlers/api/v1/admin"),
                Environment = new Dictionary<string, string>
                {
                    ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1",
                    ["PARAMETER_NAME"] = "/Music/AdminPanel/MUT"
                },
                Description = "Lambda function to retrieve Music User Token from Parameter Store (Version 1)",
                Role = new Role(this, "Music-GetMutFunctionV1Role", new RoleProps
                {
                    AssumedBy = new ServicePrincipal("lambda.amazonaws.com")
                })
            });
        var getMutV1Function = getMutV1FunctionConstruct.Function;

        // Grant Lambda permission to read from Parameter Store
        mutParameter.GrantRead(getMutV1Function);

        #endregion

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

        var nodejsResource = new ApiGatewayResource(this, "Music-NodejsResource", new ApiGatewayResourceProps
        {
            ParentResource = restApiGateway.Root,
            PathPart = "nodejs"
        }).Resource;

        var v1Resource = new ApiGatewayResource(this, "Music-V1Resource", new ApiGatewayResourceProps
        {
            ParentResource = nodejsResource,
            PathPart = "v1"
        }).Resource;

        var mutV1Resource = new ApiGatewayResource(this, "Music-MutV1Resource", new ApiGatewayResourceProps
        {
            ParentResource = v1Resource,
            PathPart = "mut"
        }).Resource;

        var scheduleV1Resource = new ApiGatewayResource(this, "Music-ScheduleV1Resource", new ApiGatewayResourceProps
        {
            ParentResource = v1Resource,
            PathPart = "schedule"
        }).Resource;

        var songLimitV1Resource = new ApiGatewayResource(this, "Music-SongLimitV1Resource", new ApiGatewayResourceProps
        {
            ParentResource = v1Resource,
            PathPart = "song-limit"
        }).Resource;

        #endregion

        #region API Gateway Integrations

        var getMutV1Integration = new ApiGatewayIntegration(this, "Music-GetMutV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getMutV1Function
            });

        var updateMutV1Integration = new ApiGatewayIntegration(this, "Music-UpdateMutV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = setMutV1Function
            });

        var getScheduleRateV1Integration = new ApiGatewayIntegration(this, "Music-GetScheduleRateV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getScheduleRateV1Function
            });

        var updateScheduleRateV1Integration = new ApiGatewayIntegration(this, "Music-UpdateScheduleRateV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = setScheduleRateV1Function
            });

        var getSongLimitV1Integration = new ApiGatewayIntegration(this, "Music-GetSongLimitV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = getSongLimitV1Function
            });

        var updateSongLimitV1Integration = new ApiGatewayIntegration(this, "Music-UpdateSongLimitV1Integration",
            new ApiGatewayIntegrationProps
            {
                Function = setSongLimitV1Function
            });

        #endregion

        #region API Gateway Methods

        var requestValidator = new RequestValidator(this, "Music-AdminApiRequestValidator", new RequestValidatorProps
        {
            RestApi = restApiGateway,
            ValidateRequestBody = true,
            ValidateRequestParameters = true
        });

        var getMutV1Method = new ApiGatewayMethod(this, "Music-GetMutV1Method", new ApiGatewayMethodProps
        {
            Resource = mutV1Resource,
            HttpMethod = "GET",
            Integration = getMutV1Integration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer,
            RequestValidator = requestValidator
        });

        var updateMutV1Method = new ApiGatewayMethod(this, "Music-UpdateMutV1Method", new ApiGatewayMethodProps
        {
            Resource = mutV1Resource,
            HttpMethod = "POST",
            Integration = updateMutV1Integration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer,
            RequestValidator = requestValidator
        });

        var getScheduleV1Method = new ApiGatewayMethod(this, "Music-GetScheduleV1Method", new ApiGatewayMethodProps
        {
            Resource = scheduleV1Resource,
            HttpMethod = "GET",
            Integration = getScheduleRateV1Integration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer,
            RequestValidator = requestValidator
        });

        var updateScheduleV1Method = new ApiGatewayMethod(this, "Music-UpdateScheduleV1Method",
            new ApiGatewayMethodProps
            {
                Resource = scheduleV1Resource,
                HttpMethod = "POST",
                Integration = updateScheduleRateV1Integration.Integration,
                AuthorizationType = AuthorizationType.COGNITO,
                Authorizer = authorizer,
                RequestValidator = requestValidator
            });

        var getSongLimitV1Method = new ApiGatewayMethod(this, "Music-GetSongLimitV1Method", new ApiGatewayMethodProps
        {
            Resource = songLimitV1Resource,
            HttpMethod = "GET",
            Integration = getSongLimitV1Integration.Integration,
            AuthorizationType = AuthorizationType.COGNITO,
            Authorizer = authorizer,
            RequestValidator = requestValidator
        });

        var updateSongLimitV1Method = new ApiGatewayMethod(this, "Music-UpdateSongLimitV1Method",
            new ApiGatewayMethodProps
            {
                Resource = songLimitV1Resource,
                HttpMethod = "POST",
                Integration = updateSongLimitV1Integration.Integration,
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
            }
        ]);

        #endregion
    }
}