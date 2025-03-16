# Music (Blazor Implementation)

## Prerequisites
- .NET 9.0 SDK or later
- A modern web browser
- For production builds:
  - Windows: PowerShell
  - macOS/Linux: Terminal with zsh/bash

## Development

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd src/app/frontend/music/music-blazor
   ```
3. Run the development server:
   ```bash
   dotnet watch run
   ```
4. Open your browser and navigate to `https://localhost:xxxx` (the port number will be displayed in your terminal)

## Production Build

1. Build and publish the project:
   ```bash
   dotnet publish -c Release
   ```

2. The publish process will automatically:
   - Create a `dist` directory in the project root
   - Copy the published files from `wwwroot`
   - Update the base href for CDN deployment

3. The production files will be available in the `dist` directory

## Performance Optimizations

This project uses .NET 9's Blazor WebAssembly optimizations:
- AOT compilation for improved runtime performance
- IL stripping after AOT compilation to reduce download size

These optimizations are configured in `Music.csproj`:
```xml
<RunAOTCompilation>true</RunAOTCompilation>
<WasmStripILAfterAOT>true</WasmStripILAfterAOT>
```

## Notes

- The post-publish process automatically detects your operating system and runs the appropriate commands
- The production build is configured to deploy to `https://music.mariolopez.org/blazor`
- If you need to modify the CDN URL, update it in the `Music.csproj` file
