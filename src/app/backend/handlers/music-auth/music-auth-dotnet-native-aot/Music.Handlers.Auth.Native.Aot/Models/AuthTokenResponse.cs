using System.Text.Json.Serialization;

namespace Music.Handlers.Auth.Native.Aot.Models;

public class AuthTokenResponse
{
    public string Token { get; set; } = default!;
}

[JsonSerializable(typeof(AuthTokenResponse))]

public partial class AuthTokenResponseJsonSerializerContext : JsonSerializerContext { }