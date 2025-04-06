# Music Infrastructure Constructs

This directory contains helper constructs to reduce boilerplate code in the infrastructure stacks.

## NodejsLambdaFunction

A Construct that creates a Node.js Lambda function with common configurations.

```csharp
var lambda = new NodejsLambdaFunction(this, "MyLambda", new NodejsLambdaFunctionProps
{
    Handler = "index.handler",
    Code = Code.FromAsset("path/to/lambda/code"),
    Role = role, // Optional
    MemorySize = 128, // Optional, defaults to 128
    Timeout = Duration.Minutes(1), // Optional, defaults to 1 minute
    Description = "My Lambda function", // Optional
    Environment = new Dictionary<string, string> // Optional
    {
        ["KEY"] = "value"
    },
    Architecture = Architecture.ARM_64, // Optional, defaults to ARM_64
    EphemeralStorageSize = Size.Mebibytes(512), // Optional, defaults to 512 MB
    Tracing = Tracing.ACTIVE // Optional, defaults to ACTIVE
});
```

## ApiGatewayIntegration

A Construct that creates an API Gateway integration with a Lambda function.

```csharp
var integration = new ApiGatewayIntegration(this, "MyIntegration", new ApiGatewayIntegrationProps
{
    LambdaFunction = lambda,
    Proxy = true, // Optional, defaults to true
    PassthroughBehavior = PassthroughBehavior.WHEN_NO_MATCH, // Optional, defaults to WHEN_NO_MATCH
    Timeout = Duration.Seconds(30), // Optional, defaults to 30 seconds
    TestInvokePermissions = true // Optional, defaults to true
});
```

## ApiGatewayMethod

A Construct that creates an API Gateway method.

```csharp
var method = new ApiGatewayMethod(this, "MyMethod", new ApiGatewayMethodProps
{
    Resource = resource,
    HttpMethod = "GET",
    Integration = integration,
    AuthorizationType = AuthorizationType.NONE, // Optional, defaults to NONE
    ApiKeyRequired = false, // Optional, defaults to false
    RequestParameters = new Dictionary<string, bool> // Optional
    {
        ["method.request.path.proxy"] = true
    }
});
```

## ApiGatewayResource

A Construct that creates an API Gateway resource.

```csharp
var resource = new ApiGatewayResource(this, "MyResource", new ApiGatewayResourceProps
{
    ParentResource = parentResource,
    PathPart = "my-resource"
});
```

## ApiGatewayProxyResource

A Construct that creates an API Gateway proxy resource.

```csharp
var proxyResource = new ApiGatewayProxyResource(this, "MyProxyResource", new ApiGatewayProxyResourceProps
{
    ParentResource = parentResource
});
```

## ApiGatewayProxyMethod

A Construct that creates an API Gateway method with proxy integration.

```csharp
var proxyMethod = new ApiGatewayProxyMethod(this, "MyProxyMethod", new ApiGatewayProxyMethodProps
{
    Resource = resource,
    HttpMethod = "ANY",
    LambdaFunction = lambda
});
```

## Example Usage

Here's an example of how to use these constructs to create an API Gateway with a Lambda function:

```csharp
// Create a Lambda function
var lambda = new NodejsLambdaFunction(this, "MyLambda", new NodejsLambdaFunctionProps
{
    Handler = "index.handler",
    Code = Code.FromAsset("path/to/lambda/code")
});

// Create an API Gateway
var api = new RestApi(this, "MyApi", new RestApiProps
{
    RestApiName = "My API",
    Description = "My API Description"
});

// Create a resource
var resource = new ApiGatewayResource(this, "MyResource", new ApiGatewayResourceProps
{
    ParentResource = api.Root,
    PathPart = "my-resource"
});

// Create a proxy method
var proxyMethod = new ApiGatewayProxyMethod(this, "MyProxyMethod", new ApiGatewayProxyMethodProps
{
    Resource = resource,
    HttpMethod = "ANY",
    LambdaFunction = lambda
});
```

This will create an API Gateway with a resource at `/my-resource` that proxies all HTTP methods to the Lambda function.
