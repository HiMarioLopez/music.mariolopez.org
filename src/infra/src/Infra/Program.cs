using Amazon.CDK;
using Infra.Stacks;

namespace Infra;

public class Program
{
    public static void Main()
    {
        var app = new App();

        var accountId = System.Environment.GetEnvironmentVariable("AWS_ACCOUNT_ID");

        var defaultRegion = System.Environment.GetEnvironmentVariable("AWS_REGION") ??
                            System.Environment.GetEnvironmentVariable("AWS_DEFAULT_REGION") ??
                            "us-east-1";

        var env = new Environment { Account = accountId, Region = defaultRegion };

        var coreStack = new CoreStack(app, "CoreStack", new StackProps
        {
            Env = env,
            StackName = "Music-CoreStack"
        });

        var authStack = new AuthStack(app, "AuthStack", coreStack.AuthApi, new StackProps
        {
            Env = env,
            StackName = "Music-AuthStack"
        });

        var siteStack = new SiteStack(app, "SiteStack", new StackProps
        {
            Env = env,
            StackName = "Music-SiteStack"
        });

        siteStack.AddDependency(coreStack);

        app.Synth();
    }
}
