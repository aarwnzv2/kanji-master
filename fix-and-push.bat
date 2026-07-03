@echo off
cd /d C:\Users\Rayan\kanji-master
git add app/page.tsx
git commit -m "Fix: Restore full page.tsx with relative imports"
git push origin main
echo.
echo ✅ Pushed! Vercel redeploy starting...
pause
