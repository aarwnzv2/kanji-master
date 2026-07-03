@echo off
cd /d C:\Users\Rayan\kanji-master
git add app/page.tsx
git commit -m "Fix: Add type assertion for TypeScript stage property"
git push origin main
echo.
echo ✅ Fixed and pushed! Vercel redeploy starting...
pause
