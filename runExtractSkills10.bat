@echo off
REM runExtractSkills10.bat - Run ollama_infer_course.py for indices 0..10
SET ROOT_DIR=%~dp0
SET SCRIPT=%ROOT_DIR%scripts\ollama_infer_course.py

FOR /L %%i IN (0,1,10) DO (
    echo Running index %%i
    if not exist "%ROOT_DIR%output\per_course" mkdir "%ROOT_DIR%output\per_course"
    REM capture stdout+stderr to a raw log for this index so we can debug failures
    py -3 "%SCRIPT%" %%i > "%ROOT_DIR%output\per_course\raw_%%i.txt" 2>&1
    if errorlevel 1 (
        echo Error on index %%i >> "%ROOT_DIR%output\ollama_course_skills_errors.txt"
        echo See raw log: output\per_course\raw_%%i.txt >> "%ROOT_DIR%output\ollama_course_skills_errors.txt"
    )
    REM wait 1 second between calls
    timeout /t 1 /nobreak >nul
)

echo "Done. Results appended to output\ollama_course_skills.json"
pause
