using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Constructs;

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
public class ApiStack : Stack
{
    internal ApiStack(Construct scope, string id, IStackProps props = null)
        : base(scope, id, props)
    {
        #region API Gateway

        // Certificate for music.mariolopez.org
        var rootCertificateArn = "arn:aws:acm:us-east-1:851725225504:certificate/70d15630-f6b4-495e-9d0c-572c64804dfc";
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
            }
        });


        // Output the API Gateway's custom domain name
        var apiDomainName = new CfnOutput(this, "Music-ApiGatewayCustomDomainName", new CfnOutputProps
        {
            Value = apiGateway.DomainName!.DomainNameAliasDomainName,
            ExportName = "Music-ApiGatewayCustomDomainName"
        });

        #endregion

        #region Secret

        // Create a new secret in Secrets Manager
        // Note: Once this secret is provisioned you'll have to set the value manually.
        var appleAuthKey = new Secret(this, "Music-AppleAuthKey", new SecretProps
        {
            SecretName = "AppleAuthKey"
        });

        // Fetch environment variables
        var teamId = System.Environment.GetEnvironmentVariable("APPLE_TEAM_ID");
        var keyId = System.Environment.GetEnvironmentVariable("APPLE_KEY_ID");

        #endregion

        #region Lambda Functions

        #region Auth Handler

        var nodejsAuthHandlerPrefix = "Music-NodejsAuthHandler";

        // Create an IAM role for the Lambda function
        var nodejsAuthLanderLambdaRole = new Role(this, $"{nodejsAuthHandlerPrefix}ExecutionRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies =
                [
                    ManagedPolicy.FromAwsManagedPolicyName(
                        "service-role/AWSLambdaBasicExecutionRole"
                    )
                ]
        });

        // Define the permissions for the Lambda function
        nodejsAuthLanderLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [appleAuthKey.SecretArn],
            Effect = Effect.ALLOW
        }));

        // Define the Lambda function
        var nodejsAuthHandlerFunction = new Function(this, $"{nodejsAuthHandlerPrefix}Lambda", new FunctionProps
        {
            Runtime = Runtime.NODEJS_20_X,
            Role = nodejsAuthLanderLambdaRole,
            Code = Code.FromAsset("../app/backend/handlers/music-auth/music-auth-nodejs"),
            Handler = "index.handler",
            Environment = new Dictionary<string, string>
                {
                    { "APPLE_AUTH_KEY_SECRET_NAME", appleAuthKey.SecretName },
                    { "APPLE_TEAM_ID", teamId },
                    { "APPLE_KEY_ID", keyId }
                },
            Description = "Generates a token for use with Apple's Music API. Built with Node.js.",

            // Main cost drivers
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
        });

        #endregion

        #region Integration API (.NET)

        var dotnetAuthHandlerPrefix = "Music-DotnetAuthHandler";

        // Create an IAM role for the Lambda function
        var dotnetAuthHandlerLambdaRole = new Role(this, $"{dotnetAuthHandlerPrefix}ExecutionRole", new RoleProps
        {
            AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
            ManagedPolicies =
                [
                    ManagedPolicy.FromAwsManagedPolicyName(
                        "service-role/AWSLambdaBasicExecutionRole"
                    )
                ]
        });

        // Define the permissions for the Lambda function
        dotnetAuthHandlerLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [appleAuthKey.SecretArn],
            Effect = Effect.ALLOW
        }));

        // Define the Lambda function
        var dotnetAuthHandlerFunction = new Function(this, $"{dotnetAuthHandlerPrefix}Lambda", new FunctionProps
        {
            Runtime = Runtime.DOTNET_8,
            Role = dotnetAuthHandlerLambdaRole,
            Code = Code.FromAsset("../app/backend/handlers/music-auth/music-auth-dotnet/Music.Handlers.Auth/bin/Release/net8.0/publish"),
            Handler = "Music.Handlers.Auth::Music.Handlers.Auth.Function::FunctionHandler",
            Environment = new Dictionary<string, string>
                {
                    { "APPLE_AUTH_KEY_SECRET_NAME", appleAuthKey.SecretName },
                    { "APPLE_TEAM_ID", teamId },
                    { "APPLE_KEY_ID", keyId }
                },
            Description = "Generates a token for use with Apple's Music API. Built with .NET.",

            // Main cost drivers
            Architecture = Architecture.X86_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
            Timeout = Duration.Seconds(29),
        });

        #endregion

        #region Integration API (.NET - Native AoT)

        // Packaging and deploying a .NET 8 Lambda function with Native AoT is not yet supported by the AWS CDK.
        // I will revisit this once the feature is available.

        // var dotnetNativeAotAuthHandlerPrefix = "Music-DotnetNativeAoTAuthHandler";

        // // Create an IAM role for the Lambda function
        // var dotnetNativeAotAuthHandlerLambdaRole = new Role(this, $"{dotnetNativeAotAuthHandlerPrefix}ExecutionRole", new RoleProps
        // {
        //     AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
        //     ManagedPolicies =
        //         [
        //             ManagedPolicy.FromAwsManagedPolicyName(
        //                 "service-role/AWSLambdaBasicExecutionRole"
        //             )
        //         ]
        // });

        // // Define the permissions for the Lambda function
        // dotnetNativeAotAuthHandlerLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        // {
        //     Actions = ["secretsmanager:GetSecretValue"],
        //     Resources = [appleAuthKey.SecretArn],
        //     Effect = Effect.ALLOW
        // }));

        // // Define the Lambda function
        // var dotnetNativeAotAuthHandlerFunction = new Function(this, $"{dotnetNativeAotAuthHandlerPrefix}Lambda", new FunctionProps
        // {
        //     Runtime = Runtime.DOTNET_8,
        //     Role = dotnetNativeAotAuthHandlerLambdaRole,
        //     Code = Code.FromAsset("../app/backend/handlers/music-auth/music-auth-dotnet-native-aot/Music.Handlers.Auth.Native.Aot/bin/Release/net8.0/Music.Handlers.Auth.Native.Aot.zip"),
        //     Handler = "Music.Handlers.Auth.Native.Aot::Music.Handlers.Auth.Native.Aot.Function::FunctionHandler",
        //     Environment = new Dictionary<string, string>
        //         {
        //             { "APPLE_AUTH_KEY_SECRET_NAME", appleAuthKey.SecretName },
        //             { "APPLE_TEAM_ID", teamId },
        //             { "APPLE_KEY_ID", keyId }
        //         },
        //     Description = "Generates a token for use with Apple's Music API. Built with .NET.",

        //     // Main cost drivers
        //     Architecture = Architecture.X86_64,
        //     MemorySize = 128,
        //     EphemeralStorageSize = Size.Mebibytes(512),
        //     Timeout = Duration.Seconds(29),
        // });

        #endregion

        #endregion

        #region Integrate Lambdas to API Gateway

        // Create a resource for the '/api/nodejs/auth/token' endpoint
        var nodejsAuthHandlerResource = apiGateway.Root.AddResource("nodejs").AddResource("auth").AddResource("token");

        // Create a method for the '/auth/token' resource that integrates with the Lambda function
        nodejsAuthHandlerResource.AddMethod("GET", new LambdaIntegration(nodejsAuthHandlerFunction, new LambdaIntegrationOptions
        {
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true
        }));

        // Create a resource for the '/api/dotnet/auth/token' endpoint
        var dotnetAuthHandlerResource = apiGateway.Root.AddResource("dotnet").AddResource("auth").AddResource("token");

        dotnetAuthHandlerResource.AddMethod("GET", new LambdaIntegration(dotnetAuthHandlerFunction, new LambdaIntegrationOptions
        {
            Timeout = Duration.Seconds(29),
            AllowTestInvoke = true,
        }));

        // // Create a resource for the '/api/dotnet/auth/token' endpoint
        // var dotnetNativeAotAuthHandlerResource = apiGateway.Root.AddResource("dotnet-native-aot").AddResource("auth").AddResource("token");

        // dotnetNativeAotAuthHandlerResource.AddMethod("GET", new LambdaIntegration(dotnetNativeAotAuthHandlerFunction, new LambdaIntegrationOptions
        // {
        //     Timeout = Duration.Seconds(29),
        //     AllowTestInvoke = true,
        // }));

        #endregion
    }
}
