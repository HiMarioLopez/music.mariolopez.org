using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Music;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Check and modify the BaseAddress
string baseAddress = builder.HostEnvironment.BaseAddress;
if (!baseAddress.EndsWith("/blazor", StringComparison.OrdinalIgnoreCase))
{
    baseAddress = baseAddress.TrimEnd('/') + "/blazor";
}

// set base address for default host
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(baseAddress) });

await builder.Build().RunAsync();
