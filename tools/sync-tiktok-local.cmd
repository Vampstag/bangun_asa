@echo off
rem Cadangan bila GitHub diblokir TikTok: sinkron video dari komputer sendiri, lalu commit dan push bila ada video baru.
rem Push memicu deploy otomatis seperti biasa. Jadwalkan lewat Task Scheduler (lihat docs/SETUP-CMS-DAN-DEPLOY.md bagian 6).
cd /d "%~dp0.."
call npm run sync:tiktok
if errorlevel 1 exit /b 1
git add src/data/content/tiktok.json src/assets/social
git diff --cached --quiet
if not errorlevel 1 (
  echo Tidak ada video baru.
  exit /b 0
)
git commit -m "Konten: video TikTok terbaru"
git push
