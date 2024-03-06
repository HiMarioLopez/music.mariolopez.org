using Amazon.CDK;
using Music.Infra.Stacks;

namespace Music.Infra;

public static class Program
{
    public static void Main()
    {
        var app = new App();

        var accountId = System.Environment.GetEnvironmentVariable("AWS_ACCOUNT_ID") ??
                        "851725225504";

        var defaultRegion = System.Environment.GetEnvironmentVariable("AWS_REGION") ??
                            System.Environment.GetEnvironmentVariable("AWS_DEFAULT_REGION") ??
                            "us-east-1";

        var env = new Environment { Account = accountId, Region = defaultRegion };

        var apiStack = new ApiStack(app, "ApiStack", new StackProps
        {
            Env = env,
            StackName = "Music-ApiStack",
            Description = "This stack contains the API Gateway and Lambda function for the Music application."
        });

        var frontendStack = new FrontendStack(app, "FrontendStack", new StackProps
        {
            Env = env,
            StackName = "Music-FrontendStack",
            Description = "This stack contains the S3 bucket and CloudFront distribution for the Music application."
        });

        // Explicitly declare that SiteStack depends on ApiStack
        frontendStack.AddDependency(apiStack);

        app.Synth();
    }
}
