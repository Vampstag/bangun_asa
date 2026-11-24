@echo off
rem Klik dua kali file ini untuk menjalankan web dan membukanya di browser.
rem Tutup jendela ini untuk menghentikan server.
cd /d "%~dp0"
if not exist node_modules (
  echo Pertama kali: memasang dependensi, tunggu sebentar...
  call npm install
)
start "" cmd /c "timeout /t 4 >nul & start http://localhost:4321"
call npm run dev
