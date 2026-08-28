@echo off
setlocal
cd /d "%~dp0"
copy /b "Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe.00.part"+"Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe.01.part"+"Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe.02.part"+"Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe.03.part" "Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe" >nul
if errorlevel 1 (
  echo Failed to assemble Aoyin Desktop Pet.
  exit /b 1
)
echo Created Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe
echo Expected SHA-256: 60e55464e111b1c78216d3210d920d8532b0eadba75a358f941784797ef6578e
endlocal
