using System.Collections.Generic;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.Lambda;
using Constructs;

namespace Music.Infra.Constructs;

/// <summary>
/// A Construct that creates an API Gateway method with proxy integration
/// </summary>
public class ApiGatewayProxyMethod : Construct
{
  /// <summary>
  /// The method created by this Construct
  /// </summary>
  public Method Method { get; }

  /// <summary>
  /// Creates a new API Gateway method with proxy integration
  /// </summary>
  /// <param name="scope">The parent Construct</param>
  /// <param name="id">The unique identifier for this Construct</param>
  /// <param name="props">The properties for the API Gateway method</param>
  public ApiGatewayProxyMethod(Construct scope, string id, ApiGatewayProxyMethodProps props)
      : base(scope, id)
  {
    // Create the integration
    var integration = new LambdaIntegration(props.LambdaFunction, new LambdaIntegrationOptions
    {
      Proxy = true,
      IntegrationResponses =
      [
        new IntegrationResponse
        {
          StatusCode = "200",
          ResponseParameters = new Dictionary<string, string>
          {
            ["method.response.header.Access-Control-Allow-Origin"] = "'*'"
          }
        }
      ]
    });

    // Create the method
    Method = props.Resource.AddMethod(props.HttpMethod, integration, new MethodOptions
    {
      AuthorizationType = AuthorizationType.NONE,
      ApiKeyRequired = false,
      MethodResponses =
      [
        new MethodResponse
        {
          StatusCode = "200",
          ResponseParameters = new Dictionary<string, bool>
          {
            ["method.response.header.Access-Control-Allow-Origin"] = true
          }
        }
      ]
    });
  }
}

/// <summary>
/// Properties for the ApiGatewayProxyMethod Construct
/// </summary>
public class ApiGatewayProxyMethodProps
{
  /// <summary>
  /// The API Gateway resource
  /// </summary>
  public required IResource Resource { get; set; }

  /// <summary>
  /// The HTTP method
  /// </summary>
  public required string HttpMethod { get; set; }

  /// <summary>
  /// The Lambda function to integrate with
  /// </summary>
  public required IFunction LambdaFunction { get; set; }
}