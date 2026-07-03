@echo off
cd /d C:\Users\Rayan\kanji-master
echo Pushing fixed code...
git add -A
git commit -m "Fix: TypeScript type error and relative imports"
git push origin main
echo.
echo ✅ ALL FIXED AND PUSHED!
echo Vercel redeploy starting...
pause
