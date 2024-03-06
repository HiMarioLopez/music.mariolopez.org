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

        // Create an IAM role for the Lambda function
        var lambdaRole = new Role(this, "Music-AuthHandlerExecutionRole", new RoleProps
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
        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = ["secretsmanager:GetSecretValue"],
            Resources = [appleAuthKey.SecretArn],
            Effect = Effect.ALLOW
        }));

        // Define the Lambda function
        var authHandlerFunction = new Function(this, "Music-AuthHandler", new FunctionProps
        {
            Runtime = Runtime.NODEJS_LATEST,
            Role = lambdaRole,
            Code = Code.FromAsset("../app/backend/handlers/music-auth"),
            Handler = "index.handler",
            Environment = new Dictionary<string, string>
                {
                    { "APPLE_AUTH_KEY_SECRET_NAME", appleAuthKey.SecretName },
                    { "TEAM_ID", teamId },
                    { "KEY_ID", keyId }
                },
            Description = "Generates a token for use with Apple's Music API.",

            // Main cost drivers
            Architecture = Architecture.ARM_64,
            MemorySize = 128,
            EphemeralStorageSize = Size.Mebibytes(512),
        });

        #endregion

        #region Integration API (Express)

        // var integrationApiExpressPrefix = "Music-IntegrationApiExpress";

        // // Create an IAM role for the Lambda function
        // var integrationApiExpressLambdaRole = new Role(this, $"{integrationApiExpressPrefix}ExecutionRole", new RoleProps
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
        // integrationApiExpressLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        // {
        //     Actions = ["secretsmanager:GetSecretValue"],
        //     Resources = [appleAuthKey.SecretArn],
        //     Effect = Effect.ALLOW
        // }));

        // // Define the Lambda function
        // var integrationApiExpressLambdaFunction = new Function(this, $"{integrationApiExpressPrefix}Lambda", new FunctionProps
        // {
        //     Runtime = Runtime.NODEJS_LATEST,
        //     Role = integrationApiExpressLambdaRole,
        //     Code = Code.FromAsset("../backend/api/integration-express"),
        //     Handler = "index.handler",
        //     Environment = new Dictionary<string, string>
        //         {
        //             { "APPLE_AUTH_KEY_SECRET_NAME", appleAuthKey.SecretName },
        //             { "TEAM_ID", teamId },
        //             { "KEY_ID", keyId }
        //         },
        //     Description = "Integration API for the Music App (interface for Apple's Music API) written in Express.",

        //     // Main cost drivers
        //     Architecture = Architecture.ARM_64,
        //     MemorySize = 128,
        //     EphemeralStorageSize = Size.Mebibytes(512),
        // });

        #endregion

        #endregion

        #region Integrate Lambdas to API Gateway

        // Create a resource for the '/auth/token' endpoint (it would be '/api/auth/token' via root domain)
        var authResource = apiGateway.Root.AddResource("services").AddResource("auth").AddResource("token");

        // Create a method for the '/auth/token' resource that integrates with the Lambda function
        authResource.AddMethod("GET", new LambdaIntegration(authHandlerFunction, new LambdaIntegrationOptions
        {
            AllowTestInvoke = true
        }));

        // var integrationApiExpressResource = apiGateway.Root.AddResource("express");
        // integrationApiExpressResource.AddMethod("GET", new LambdaIntegration(integrationApiExpressLambdaFunction, new LambdaIntegrationOptions
        // {
        //     AllowTestInvoke = true,
        //     Timeout = Duration.Seconds(10)
        // }));

        // integrationApiExpressResource.AddProxy(new ProxyResourceOptions
        // {
        //     AnyMethod = true,
        //     DefaultIntegration = new LambdaIntegration(integrationApiExpressLambdaFunction)
        // });

        #endregion
    }
}
