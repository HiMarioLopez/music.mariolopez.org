# PostPublishCopy.ps1
param(
    [string]$sourceDir, # This should be the path to 'wwwroot'
    [string]$targetDir  # This should be the path to 'dist'
)

# Ensure the source directory path ends with a backslash
$sourceDir = [System.IO.Path]::GetFullPath($sourceDir)

# Copy each item in directory-1 directly into the target directory
Get-ChildItem -Path $sourceDir -Recurse | ForEach-Object {
    $targetPath = $_.FullName.Replace($sourceDir, $targetDir)
    if (-not (Test-Path (Split-Path -Path $targetPath -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path -Path $targetPath -Parent) | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $targetPath -Force
}
