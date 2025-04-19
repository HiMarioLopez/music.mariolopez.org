using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Lambda;
using Constructs;

namespace Music.Infra.Constructs;

/// <summary>
///     A Construct that creates an API Gateway integration with a Lambda function
/// </summary>
public class ApiGatewayIntegration : Construct
{
    /// <summary>
    ///     Creates a new API Gateway integration with a Lambda function
    /// </summary>
    /// <param name="scope">The parent Construct</param>
    /// <param name="id">The unique identifier for this Construct</param>
    /// <param name="props">The properties for the API Gateway integration</param>
    public ApiGatewayIntegration(Construct scope, string id, ApiGatewayIntegrationProps props)
        : base(scope, id)
    {
        // Create the Lambda integration
        Integration = new LambdaIntegration(props.Function, new LambdaIntegrationOptions
        {
            Proxy = props.Proxy ?? true,
            PassthroughBehavior = props.PassthroughBehavior ?? PassthroughBehavior.WHEN_NO_MATCH,
            Timeout = props.Timeout ?? Duration.Seconds(29),
            AllowTestInvoke = props.AllowTestInvoke ?? true
        });
    }

    /// <summary>
    ///     The Lambda integration created by this Construct
    /// </summary>
    public LambdaIntegration Integration { get; }
}

/// <summary>
///     Properties for the ApiGatewayIntegration Construct
/// </summary>
public class ApiGatewayIntegrationProps
{
    /// <summary>
    ///     The Lambda function to integrate with
    /// </summary>
    public required Function Function { get; set; }

    /// <summary>
    ///     Whether to use proxy integration (default: true)
    /// </summary>
    public bool? Proxy { get; set; }

    /// <summary>
    ///     The passthrough behavior (default: WHEN_NO_MATCH)
    /// </summary>
    public PassthroughBehavior? PassthroughBehavior { get; set; }

    /// <summary>
    ///     The timeout for the integration (default: 29 seconds)
    /// </summary>
    public Duration? Timeout { get; set; }

    /// <summary>
    ///     Whether to allow test invokes (default: true)
    /// </summary>
    public bool? AllowTestInvoke { get; set; }
}