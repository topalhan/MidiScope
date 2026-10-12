@echo off
echo ========================================================
echo Installing MidiSheet VST3 Plugin to System VST3 Directory
echo ========================================================

set SRC=%~dp0\build\MidiSheet_artefacts\Debug\VST3\MidiSheet.vst3
set USER_DEST=%LOCALAPPDATA%\Programs\Common\VST3\MidiSheet.vst3
set SYS_DEST=%CommonProgramFiles%\VST3\MidiSheet.vst3

echo [1/2] Installing to User VST3 directory (%USER_DEST%)...
xcopy /E /I /Y "%SRC%" "%USER_DEST%" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Successfully copied to User VST3 directory.
) else (
    echo [WARN] Failed copying to User VST3 directory.
)

echo.
echo [2/2] Attempting to install to System VST3 directory (%SYS_DEST%)...
xcopy /E /I /Y "%SRC%" "%SYS_DEST%" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Successfully copied to System VST3 directory.
) else (
    echo [NOTE] System VST3 directory requires Administrator privileges.
    echo        If your DAW only scans %CommonProgramFiles%\VST3, right-click
    echo        this install.bat and select 'Run as Administrator'.
)

echo.
echo Installation complete! Remember standalone version is at N:\projects\learning\build\MidiSheet_artefacts\Debug\Standalone\MidiSheet.exe
pause
