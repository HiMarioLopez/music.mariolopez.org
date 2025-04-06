using System.Collections.Generic;
using Amazon.CDK.AWS.APIGateway;
using Constructs;

namespace Music.Infra.Constructs;

/// <summary>
/// A Construct that adds a method to an API Gateway resource
/// </summary>
public class ApiGatewayMethod : Construct
{
  /// <summary>
  /// The method created by this Construct
  /// </summary>
  public Method Method { get; }

  /// <summary>
  /// Creates a new API Gateway method
  /// </summary>
  /// <param name="scope">The parent Construct</param>
  /// <param name="id">The unique identifier for this Construct</param>
  /// <param name="props">The properties for the API Gateway method</param>
  public ApiGatewayMethod(Construct scope, string id, ApiGatewayMethodProps props)
      : base(scope, id)
  {
    // Add the method to the resource
    Method = props.Resource.AddMethod(props.HttpMethod, props.Integration, new MethodOptions
    {
      AuthorizationType = props.AuthorizationType ?? AuthorizationType.NONE,
      Authorizer = props.Authorizer,
      ApiKeyRequired = props.ApiKeyRequired ?? false,
      RequestParameters = props.RequestParameters
    });
  }
}

/// <summary>
/// Properties for the ApiGatewayMethod Construct
/// </summary>
public class ApiGatewayMethodProps
{
  /// <summary>
  /// The API Gateway resource to add the method to
  /// </summary>
  public required Resource Resource { get; set; }

  /// <summary>
  /// The HTTP method (e.g., "GET", "POST")
  /// </summary>
  public required string HttpMethod { get; set; }

  /// <summary>
  /// The integration for the method
  /// </summary>
  public required Integration Integration { get; set; }

  /// <summary>
  /// The authorization type (default: NONE)
  /// </summary>
  public AuthorizationType? AuthorizationType { get; set; }

  /// <summary>
  /// The authorizer for the method
  /// </summary>
  public IAuthorizer? Authorizer { get; set; }

  /// <summary>
  /// Whether the method requires an API key (default: false)
  /// </summary>
  public bool? ApiKeyRequired { get; set; }

  /// <summary>
  /// The request parameters for the method
  /// </summary>
  public Dictionary<string, bool>? RequestParameters { get; set; }
}