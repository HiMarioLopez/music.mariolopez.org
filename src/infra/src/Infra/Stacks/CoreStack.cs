using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Constructs;

namespace Infra.Stacks;

public class CoreStack : Stack
{
    public RestApi AuthApi { get; private set; }

    public CoreStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
    {
        #region API Gateway

        // Create a new REST API
        AuthApi = new RestApi(this, "IntegrationApiGateway", new RestApiProps
        {
            RestApiName = "Integration API Gateway",
            Description = "This gateway serves a variety of integration-related services."
        });

        #endregion
    }
}
