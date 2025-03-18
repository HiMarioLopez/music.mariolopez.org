using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using AWS.Lambda.Powertools.Logging;
using AWS.Lambda.Powertools.Tracing;
using Microsoft.Extensions.DependencyInjection;
using Music.Handlers.Auth.Handlers;
using Music.Handlers.Auth.Services;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace Music.Handlers.Auth;

public class Function
{
    private readonly ServiceCollection _serviceCollection;
    private readonly ServiceProvider _serviceProvider;

    public Function()
    {
        _serviceCollection = new ServiceCollection();
        ConfigureServices(_serviceCollection);
        _serviceProvider = _serviceCollection.BuildServiceProvider();
    }

    [Logging(LogEvent = true)]
    [Tracing]
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        var authTokenHandler = _serviceProvider.GetRequiredService<AuthTokenHandler>();
        return await authTokenHandler.HandleAsync(request, context);
    }

    private void ConfigureServices(IServiceCollection services)
    {
        services.AddAWSService<Amazon.SecretsManager.IAmazonSecretsManager>();
        services.AddSingleton<IAppleMusicService, AppleMusicService>();
        services.AddSingleton<AuthTokenHandler>();
    }
}