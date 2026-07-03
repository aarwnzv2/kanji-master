@echo off
for /r "C:\Users\Rayan\AppData\Roaming\Claude" %%F in (kanji-page.tsx) do (
    copy "%%F" "C:\Users\Rayan\kanji-master\app\page.tsx" /Y
    echo ✓ Fichier copie!
    exit /b 0
)
echo Fichier non trouve