param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername
)

Write-Host "Deploying CareerFinder to GitHub..." -ForegroundColor Green

# Git setup
git init
git add .
git commit -m "Initial commit: CareerFinder - Modern job search platform"
git branch -M main

# Connect to GitHub
$repoUrl = "https://github.com/$GitHubUsername/CareerFinder.git"
git remote add origin $repoUrl

# Push
git push -u origin main

Write-Host "Successfully deployed to GitHub!" -ForegroundColor Green
Write-Host "Repository: $repoUrl" -ForegroundColor White