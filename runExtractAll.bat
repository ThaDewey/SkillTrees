@echo off
REM runExtractAll.bat - Run ollama_infer_course.py for every course in the source JSON
REM Usage: runExtractAll.bat [console]
REM If 'console' is provided, per-index Python output is shown in the console and appended to the aggregated log.

SETLOCAL ENABLEDELAYEDEXPANSION

REM Force Python I/O to UTF-8 to avoid decode errors
set "PYTHONIOENCODING=utf-8"

SET "ROOT_DIR=%~dp0"
SET "SCRIPT=%ROOT_DIR%scripts\ollama_infer_course.py"

REM output files
SET "AGG_LOG=%ROOT_DIR%output\all_extractors_output.log"
SET "ERR_LOG=%ROOT_DIR%output\ollama_course_skills_errors.txt"

if not exist "%ROOT_DIR%output" mkdir "%ROOT_DIR%output"

REM compute count using Python and write to temp file
SET "COUNT_FILE=%ROOT_DIR%count.tmp"
del /f /q "%COUNT_FILE%" 2>nul
py -3 -c "import json
try:
    j=json.load(open(r'%ROOT_DIR%UCOInfo\full Course Desription.json','r',encoding='utf-8'))
    if isinstance(j,(list,tuple)):
        print(len(j))
    elif isinstance(j,dict) and 'courses' in j and isinstance(j['courses'],(list,tuple)):
        print(len(j['courses']))
    else:
        print(0)
except Exception:
    print(0)
" > "%COUNT_FILE%" 2>nul

if exist "%COUNT_FILE%" (
    set /p COUNT=<"%COUNT_FILE%"
) else (
    set "COUNT=0"
)

if "%COUNT%"=="" set "COUNT=0"
set /A END=%COUNT%-1

if %COUNT% LEQ 0 (
    echo No courses found, nothing to do. >&2
    exit /b 0
)

echo Processing %COUNT% courses (0..%END%)
echo Aggregated log: %AGG_LOG%

REM choose mode: console shows per-index output in terminal (via PowerShell Tee), otherwise append-only
set "SHOW_CONSOLE=0"
if /I "%~1"=="console" set "SHOW_CONSOLE=1"

for /L %%i in (0,1,%END%) do (
    echo Running index %%i
    if exist "%SCRIPT%" (
        echo --- Index %%i: start %DATE% %TIME% --- >> "%AGG_LOG%"
        if "%SHOW_CONSOLE%"=="1" (
            powershell -NoProfile -Command "& { & 'py' -3 '%SCRIPT%' %%i 2>&1 | Tee-Object -FilePath '%AGG_LOG%' -Append }"
        ) else (
            py -3 "%SCRIPT%" %%i >> "%AGG_LOG%" 2>&1
        )
        if errorlevel 1 (
            echo Error on index %%i >> "%ERR_LOG%"
            echo See aggregated log for output: output\all_extractors_output.log >> "%ERR_LOG%"
        ) else (
            echo Index %%i completed successfully >> "%AGG_LOG%"
        )
        echo --- Index %%i: end %DATE% %TIME% --- >> "%AGG_LOG%"
    ) else (
        echo ERROR: script not found: %SCRIPT% >&2
        exit /b 1
    )
    REM small delay between calls
    timeout /t 1 /nobreak >nul
)

echo Done. Results appended to %AGG_LOG%
exit /b 0
