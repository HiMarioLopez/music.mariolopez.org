using Constructs;

namespace Music.Infra.Constructs;

/// <summary>
/// A Construct that creates an API Gateway proxy resource
/// </summary>
public class ApiGatewayProxyResource : Construct
{
  /// <summary>
  /// The proxy resource created by this Construct
  /// </summary>
  public Amazon.CDK.AWS.APIGateway.Resource ProxyResource { get; }

  /// <summary>
  /// Creates a new API Gateway proxy resource
  /// </summary>
  /// <param name="scope">The parent Construct</param>
  /// <param name="id">The unique identifier for this Construct</param>
  /// <param name="props">The properties for the API Gateway proxy resource</param>
  public ApiGatewayProxyResource(Construct scope, string id, ApiGatewayProxyResourceProps props)
      : base(scope, id)
  {
    // Create the proxy resource
    ProxyResource = props.ParentResource.AddResource("{proxy+}");
  }
}

/// <summary>
/// Properties for the ApiGatewayProxyResource Construct
/// </summary>
public class ApiGatewayProxyResourceProps
{
  /// <summary>
  /// The parent resource
  /// </summary>
  public required Amazon.CDK.AWS.APIGateway.IResource ParentResource { get; set; }
}