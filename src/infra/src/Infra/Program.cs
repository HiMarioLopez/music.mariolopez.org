using Amazon.CDK;
using Infra.Stacks;

namespace Infra;

public class Program
{
    public static void Main()
    {
        var app = new App();

        _ = new AuthStack(app, "AuthStack", new StackProps { StackName = "Music-AuthStack" });

        app.Synth();
    }
}
