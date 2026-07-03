Write-Host "🚀 Pushing Kanji Master to GitHub..." -ForegroundColor Cyan
cd "C:\Users\Rayan\kanji-master"

# Clean git state
git status

# Stage all changes
git add -A
Write-Host "✅ Files staged" -ForegroundColor Green

# Commit
git commit -m "Fix: Use relative imports for React hooks"
Write-Host "✅ Changes committed" -ForegroundColor Green

# Push to GitHub
git push origin main
Write-Host "✅ Pushed to GitHub! Vercel will redeploy in ~60 seconds" -ForegroundColor Green

Read-Host "Press Enter to close"
