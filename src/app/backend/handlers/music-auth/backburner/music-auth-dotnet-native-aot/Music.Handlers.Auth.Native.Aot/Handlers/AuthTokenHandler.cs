using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Music.Handlers.Auth.Native.Aot.Models;
using Music.Handlers.Auth.Native.Aot.Services;
using System.Text.Json;

namespace Music.Handlers.Auth.Native.Aot.Handlers;

public class AuthTokenHandler
{
    private readonly AppleMusicService _appleMusicService = new();

    public async Task<APIGatewayProxyResponse> HandleAsync(APIGatewayProxyRequest _, ILambdaContext context)
    {
        try
        {
            var token = await _appleMusicService.GetAuthTokenAsync();
            var response = new AuthTokenResponse { Token = token };

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(response, AuthTokenResponseJsonSerializerContext.Default.AuthTokenResponse),
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching secret or generating token: {ex.Message}");
            context.Logger.LogError(ex.StackTrace);

            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = "Error processing your request",
            };
        }
    }
}