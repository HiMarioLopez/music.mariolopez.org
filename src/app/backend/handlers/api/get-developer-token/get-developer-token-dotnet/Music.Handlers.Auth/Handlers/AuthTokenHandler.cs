using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Music.Handlers.Auth.Models;
using Music.Handlers.Auth.Services;

namespace Music.Handlers.Auth.Handlers;

public class AuthTokenHandler
{
    private readonly IAppleMusicService _appleMusicService;

    public AuthTokenHandler(IAppleMusicService appleMusicService)
    {
        _appleMusicService = appleMusicService;
    }

    public async Task<APIGatewayProxyResponse> HandleAsync(APIGatewayProxyRequest _, ILambdaContext context)
    {
        try
        {
            var token = await _appleMusicService.GetAuthTokenAsync();
            var response = new AuthTokenResponse { Token = token };

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = System.Text.Json.JsonSerializer.Serialize(response),
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching secret or generating token: {ex.Message}");
            context.Logger.LogError(ex.StackTrace);

            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = System.Text.Json.JsonSerializer.Serialize(new { error = "Error processing your request" }),
            };
        }
    }
}