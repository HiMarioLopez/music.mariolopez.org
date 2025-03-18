# Set the path to your Lambda function project
$projectPath = "..\Music.Handlers.Auth"

# Set the output directory for the published Lambda function
$outputDir = Join-Path $projectPath "bin\Release\net8.0\publish"

# Clean the project
dotnet clean $projectPath

# Restore the project dependencies
dotnet restore $projectPath

# Build the project
dotnet build $projectPath --configuration Release

# Publish the Lambda function
dotnet publish $projectPath --configuration Release --output $outputDir -r linux-x64