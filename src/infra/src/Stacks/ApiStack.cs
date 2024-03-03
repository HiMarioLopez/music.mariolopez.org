using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Constructs;

namespace MusicInfra.Stacks;

/// <summary>
/// Defines the stack for the music.mariolopez.org API.
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

        // Create a new REST API
        var authApi = new RestApi(this, "Music-IntegrationApiGateway", new RestApiProps
        {
            RestApiName = "Integration API Gateway",
            Description = "This gateway serves a variety of integration-related services."
        });

        #endregion

        #region Secret

        // Create a new secret in Secrets Manager
        // Note: Once this secret is provisioned you'll have to set the value manually.
        var appleAuthKey = new Secret(this, "Music-AppleAuthKey", new SecretProps
        {
            SecretName = "AppleAuthKey"
        });

        #endregion

        #region Lambda Function

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

        // Fetch environment variables
        var teamId = System.Environment.GetEnvironmentVariable("APPLE_TEAM_ID");
        var keyId = System.Environment.GetEnvironmentVariable("APPLE_KEY_ID");

        // Define the Lambda function
        var lambdaFunction = new Function(this, "Music-AuthHandler", new FunctionProps
        {
            Runtime = Runtime.NODEJS_LATEST,
            Role = lambdaRole,
            Code = Code.FromAsset("../backend/handlers/auth-handler"),
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

        #region Integrate to API Gateway

        // Create a resource for the '/api/auth/token' endpoint
        var authResource = authApi.Root.AddResource("api").AddResource("auth").AddResource("token");

        // Create a method for the '/auth/token' resource that integrates with the Lambda function
        authResource.AddMethod("GET", new LambdaIntegration(lambdaFunction, new LambdaIntegrationOptions
        {
            AllowTestInvoke = true,
            Timeout = Duration.Seconds(10)
        }));

        #endregion
    }
}
