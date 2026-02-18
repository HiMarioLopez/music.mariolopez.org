using System.Collections.Generic;
using Amazon.CDK;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Constructs;

namespace Music.Infra.Constructs;

/// <summary>
/// A Construct that creates a Node.js Lambda function with common configurations
/// </summary>
public class NodejsLambdaFunction : Construct
{
  /// <summary>
  /// The Lambda function created by this Construct
  /// </summary>
  public Function Function { get; }

  /// <summary>
  /// The IAM role associated with the Lambda function
  /// </summary>
  public Role Role { get; }

  /// <summary>
  /// Creates a new Node.js Lambda function with common configurations
  /// </summary>
  /// <param name="scope">The parent Construct</param>
  /// <param name="id">The unique identifier for this Construct</param>
  /// <param name="props">The properties for the Lambda function</param>
  public NodejsLambdaFunction(Construct scope, string id, NodejsLambdaFunctionProps props)
      : base(scope, id)
  {
    // Create the Lambda role if not provided
    Role = props.Role ?? new Role(this, $"{id}Role", new RoleProps
    {
      AssumedBy = new ServicePrincipal("lambda.amazonaws.com"),
      Description = $"Role for {props.Description ?? id} Lambda function",
      ManagedPolicies =
        [
          ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
        ]
    });

    // Add CloudWatch permissions to Lambda role
    Role.AddToPolicy(new PolicyStatement(new PolicyStatementProps
    {
      Effect = Effect.ALLOW,
      Actions = ["cloudwatch:PutMetricData"],
      Resources = ["*"]
    }));

    // Create the Lambda function
    Function = new Function(this, id, new FunctionProps
    {
      Runtime = Runtime.NODEJS_24_X,
      Handler = props.Handler,
      Code = props.Code,
      Role = Role,
      MemorySize = props.MemorySize ?? 128,
      Timeout = props.Timeout ?? Duration.Seconds(29),
      Description = props.Description,
      Environment = props.Environment ?? new Dictionary<string, string>
      {
        ["AWS_NODEJS_CONNECTION_REUSE_ENABLED"] = "1"
      },
      Architecture = props.Architecture ?? Architecture.ARM_64,
      EphemeralStorageSize = props.EphemeralStorageSize ?? Size.Mebibytes(512),
      Tracing = props.Tracing ?? Tracing.ACTIVE
    });
  }
}

/// <summary>
/// Properties for the NodejsLambdaFunction Construct
/// </summary>
public class NodejsLambdaFunctionProps
{
  /// <summary>
  /// The handler for the Lambda function
  /// </summary>
  public required string Handler { get; set; }

  /// <summary>
  /// The code for the Lambda function
  /// </summary>
  public required Code Code { get; set; }

  /// <summary>
  /// The IAM role for the Lambda function (optional, will be created if not provided)
  /// </summary>
  public required Role Role { get; set; }

  /// <summary>
  /// The memory size for the Lambda function (default: 128)
  /// </summary>
  public int? MemorySize { get; set; }

  /// <summary>
  /// The timeout for the Lambda function (default: 29 seconds)
  /// </summary>
  public Duration? Timeout { get; set; }

  /// <summary>
  /// The description for the Lambda function
  /// </summary>
  public required string Description { get; set; }

  /// <summary>
  /// The environment variables for the Lambda function
  /// </summary>
  public Dictionary<string, string>? Environment { get; set; }

  /// <summary>
  /// The architecture for the Lambda function (default: ARM_64)
  /// </summary>
  public Architecture? Architecture { get; set; }

  /// <summary>
  /// The ephemeral storage size for the Lambda function (default: 512 MB)
  /// </summary>
  public Size? EphemeralStorageSize { get; set; }

  /// <summary>
  /// The tracing mode for the Lambda function (default: ACTIVE)
  /// </summary>
  public Tracing? Tracing { get; set; }
}