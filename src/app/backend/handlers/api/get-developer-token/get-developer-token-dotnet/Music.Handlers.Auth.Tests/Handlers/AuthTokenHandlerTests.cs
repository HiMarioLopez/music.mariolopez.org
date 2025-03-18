using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.TestUtilities;
using NSubstitute;
using Music.Handlers.Auth.Handlers;
using Music.Handlers.Auth.Services;
using Xunit;

namespace Music.Handlers.Auth.Tests.Handlers;

public class AuthTokenHandlerTests
{
    [Fact]
    public async Task HandleAsync_ReturnsAuthToken()
    {
        // Arrange
        var mockAppleMusicService = Substitute.For<IAppleMusicService>();
        mockAppleMusicService.GetAuthTokenAsync().Returns("test_token");

        var handler = new AuthTokenHandler(mockAppleMusicService);
        var request = new APIGatewayProxyRequest();
        var context = new TestLambdaContext();

        // Act
        var response = await handler.HandleAsync(request, context);

        // Assert
        Assert.Equal(200, response.StatusCode);
        Assert.Contains("test_token", response.Body);
    }
}