using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using Microsoft.IdentityModel.Tokens;

namespace Music.Handlers.Auth.Services;

public interface IAppleMusicService
{
    Task<string> GetAuthTokenAsync();
}

public class AppleMusicService : IAppleMusicService
{
    private readonly IAmazonSecretsManager _secretsManager;

    public AppleMusicService(IAmazonSecretsManager secretsManager)
    {
        _secretsManager = secretsManager;
    }

    public async Task<string> GetAuthTokenAsync()
    {
        var secretName = Environment.GetEnvironmentVariable("APPLE_AUTH_KEY_SECRET_NAME");
        var teamId = Environment.GetEnvironmentVariable("APPLE_TEAM_ID");
        var keyId = Environment.GetEnvironmentVariable("APPLE_KEY_ID");

        if (string.IsNullOrEmpty(secretName) || string.IsNullOrEmpty(teamId) || string.IsNullOrEmpty(keyId))
        {
            throw new InvalidOperationException("Missing required environment variables.");
        }

        var applePrivateKey = await GetSecretAsync(secretName);
        var privateKey = applePrivateKey.Replace("\\n", "\n");

        using var es256Key = ECDsa.Create();
        es256Key.ImportFromPem(privateKey);

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityKey = new ECDsaSecurityKey(es256Key) { KeyId = keyId };
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = teamId,
            SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.EcdsaSha256)
            {
                CryptoProviderFactory = new CryptoProviderFactory { CacheSignatureProviders = false }
            },
            Claims = new Dictionary<string, object>()
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private async Task<string> GetSecretAsync(string secretName)
    {
        var request = new GetSecretValueRequest { SecretId = secretName };
        var response = await _secretsManager.GetSecretValueAsync(request);
        return response.SecretString;
    }
}