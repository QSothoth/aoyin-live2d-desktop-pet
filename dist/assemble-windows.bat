@echo off
setlocal
cd /d "%~dp0"
copy /b "Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe.00.part"+"Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe.01.part"+"Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe.02.part"+"Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe.03.part"+"Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe.04.part" "Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe" >nul
if errorlevel 1 (
  echo Failed to assemble Aoyin Desktop Pet.
  exit /b 1
)
echo Created Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe
echo Expected SHA-256: d82c7d4009c7b60e3c2425019549db11c75fe7c094144c20ecae3deddd7152c5
endlocal
