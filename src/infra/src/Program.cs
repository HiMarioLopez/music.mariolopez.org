using Amazon.CDK;
using Music.Infra.Stacks;
using Music.Infra.Config;

namespace Music.Infra;

public static class Program
{
    public static void Main()
    {
        var app = new App();
        var configuration = ConfigurationHelper.BuildConfiguration();

        var accountId = configuration["AWS:AccountId"];
        var defaultRegion = configuration["AWS:Region"];

        var env = new Environment { Account = accountId, Region = defaultRegion };

        var apiStack = new ApiStack(app, "ApiStack", new StackProps
        {
            Env = env,
            StackName = "Music-ApiStack",
            Description = "This stack contains the API Gateway and Lambda function(s) for the Music application."
        }, configuration);

        var frontendStack = new FrontendStack(app, "FrontendStack", new StackProps
        {
            Env = env,
            StackName = "Music-FrontendStack",
            Description = "This stack contains the S3 bucket and CloudFront distribution for the primary Music application."
        });

        frontendStack.AddDependency(apiStack);

        var adminPanelStack = new AdminPanelStack(app, "Music-AdminPanelStack", new StackProps
        {
            Env = new Environment
            {
                Account = System.Environment.GetEnvironmentVariable("CDK_DEFAULT_ACCOUNT"),
                Region = System.Environment.GetEnvironmentVariable("CDK_DEFAULT_REGION")
            },
            StackName = "Music-AdminPanelStack",
            Description = "This stack contains resources for the admin panel for the Music application."
        }, configuration);

        adminPanelStack.AddDependency(apiStack);
        adminPanelStack.AddDependency(frontendStack);

        app.Synth();
    }
}
