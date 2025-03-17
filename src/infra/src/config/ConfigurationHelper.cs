using Microsoft.Extensions.Configuration;
using System.IO;

namespace Music.Infra.Config;

public static class ConfigurationHelper
{
    public static IConfiguration BuildConfiguration()
    {
        var environment = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        return new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "src", "config"))
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build();
    }
}