param(
    [string]$indexFilePath, # The full path to your index.html file
    [string]$cdnUrl # Your CDN URL to prepend
)

# Read the content of the index.html file
$content = Get-Content $indexFilePath -Raw

# Pattern to match href and src attributes, excluding those within <base> tags
$pattern = '(?<=href="|src=")(?!http)'

# Prepend CDN URL to all matching href and src attributes
$updatedContent = $content -replace $pattern, "$cdnUrl/"

# Write the updated content back to the index.html file
Set-Content $indexFilePath -Value $updatedContent