using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.SecretsManager;
using Constructs;

namespace Infra.Stacks;

public class AuthStack : Stack
{
    internal AuthStack(Construct scope, string id, IStackProps props = null)
        : base(scope, id, props)
    {
        #region Secret

        // Create a new secret in Secrets Manager
        var appleAuthKey = new Secret(
            this,
            "AppleAuthKey",
            new SecretProps
            {
                SecretName = "AppleAuthKey"
            }
        );

        #endregion

        #region Lambda Function

        // Create an IAM role for the Lambda function
        var lambdaRole = new Role(
            this,
            "AuthHandlerExecutionRole",
            new RoleProps
            {
                AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
                ManagedPolicies =
                [
                    ManagedPolicy.FromAwsManagedPolicyName(
                        "service-role/AWSLambdaBasicExecutionRole"
                    )
                ]
            }
        );

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
        var lambdaFunction = new Function(
            this,
            "AuthHandler",
            new FunctionProps
            {
                Runtime = Runtime.NODEJS_LATEST,
                Role = lambdaRole,
                Code = Code.FromAsset("../backend/auth-handler"),
                Handler = "index.handler",
                Environment = new Dictionary<string, string>
                {
                    { "APPLE_AUTH_KEY_SECRET_NAME", appleAuthKey.SecretName },
                    { "TEAM_ID", teamId },
                    { "KEY_ID", keyId }
                },
                Description = "Generates a token for use with Apple's Music API.",
            }
        );

        #endregion
    }
}
