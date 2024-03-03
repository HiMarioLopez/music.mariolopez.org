using Amazon.CDK;
using MusicInfra.Stacks;

namespace MusicInfra;

public class Program
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

        var baseSiteStack = new SiteStack(app, "SiteStack", new StackProps
        {
            Env = env,
            StackName = "Music-SiteStack",
            Description = "This stack contains the S3 bucket and CloudFront distribution for the Music application."
        });

        app.Synth();
    }
}
