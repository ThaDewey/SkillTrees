@echo off
REM runAllExtractors.bat - Run the extractor for indices 0..99, writing per-course raw logs
SETLOCAL ENABLEDELAYEDEXPANSION
SET ROOT_DIR=%~dp0
SET SCRIPT=%ROOT_DIR%scripts\ollama_infer_course.py

REM ensure output folders exist
if not exist "%ROOT_DIR%output" mkdir "%ROOT_DIR%output"
if not exist "%ROOT_DIR%output\per_course" mkdir "%ROOT_DIR%output\per_course"

REM loop indices based on number of courses in the source JSON and append all output to a single log
SET AGG_LOG=%ROOT_DIR%output\all_extractors_output.log
echo ================================================== >> "%AGG_LOG%"
echo Run started: %DATE% %TIME% >> "%AGG_LOG%"
echo ================================================== >> "%AGG_LOG%"

REM Determine course count from the source JSON using Python
set "SRC=%ROOT_DIR%UCOInfo\full Course Desription.json"
if not exist "%SRC%" (
    echo Source file not found: %SRC% >> "%AGG_LOG%"
    echo ERROR: Source file not found: %SRC%
    exit /b 1
)
FOR /F "usebackq delims=" %%N IN (`py -3 -c "import json,sys; print(len(json.load(open(r'%SRC%','r',encoding='utf-8'))))"`) DO set "COUNT=%%N"
if "%COUNT%"=="" set "COUNT=0"
set /A END=%COUNT%-1

if %COUNT% LEQ 0 (
    echo No courses found in source (%SRC%), nothing to do. >> "%AGG_LOG%"
    echo No courses found: %SRC%
    exit /b 0
)

echo Processing %COUNT% courses (0..%END%) >> "%AGG_LOG%"

FOR /L %%i IN (0,1,%END%) DO (
    echo Running index %%i
    if exist "%SCRIPT%" (
        echo --- Index %%i: start %DATE% %TIME% --- >> "%AGG_LOG%"
        py -3 "%SCRIPT%" %%i >> "%AGG_LOG%" 2>&1
        if errorlevel 1 (
            echo Error on index %%i >> "%ROOT_DIR%output\ollama_course_skills_errors.txt"
            echo See aggregated log for output: output\all_extractors_output.log >> "%ROOT_DIR%output\ollama_course_skills_errors.txt"
        ) else (
            echo Index %%i completed successfully >> "%AGG_LOG%"
        )
        echo --- Index %%i: end %DATE% %TIME% --- >> "%AGG_LOG%"
    ) else (
        echo ERROR: script not found: %SCRIPT% >> "%AGG_LOG%"
        exit /b 1
    )
    REM wait 1 second between calls
    timeout /t 1 /nobreak >nul
)

echo "Done. Results appended to output\ollama_course_skills.json"
pause
