using Constructs;

namespace Music.Infra.Constructs;

/// <summary>
/// A Construct that creates an API Gateway resource
/// </summary>
public class ApiGatewayResource : Construct
{
  /// <summary>
  /// The resource created by this Construct
  /// </summary>
  public Amazon.CDK.AWS.APIGateway.Resource Resource { get; }

  /// <summary>
  /// Creates a new API Gateway resource
  /// </summary>
  /// <param name="scope">The parent Construct</param>
  /// <param name="id">The unique identifier for this Construct</param>
  /// <param name="props">The properties for the API Gateway resource</param>
  public ApiGatewayResource(Construct scope, string id, ApiGatewayResourceProps props)
      : base(scope, id)
  {
    // Create the resource
    Resource = props.ParentResource.AddResource(props.PathPart);
  }
}

/// <summary>
/// Properties for the ApiGatewayResource Construct
/// </summary>
public class ApiGatewayResourceProps
{
  /// <summary>
  /// The parent resource
  /// </summary>
  public required Amazon.CDK.AWS.APIGateway.IResource ParentResource { get; set; }

  /// <summary>
  /// The path part for the resource
  /// </summary>
  public required string PathPart { get; set; }
}