@echo off
setlocal

rem ensure output folders exist
if not exist ".\output" mkdir ".\output"
if not exist ".\output\per_course" mkdir ".\output\per_course"

rem loop indices 0..99 and run the python script; on error log index to master error file
for /L %%i in (0,1,99) do (
  echo Running index %%i
  py -3 .\scripts\ollama_infer_course.py %%i
  if errorlevel 1 (
    echo Error on index %%i >> .\output\ollama_course_skills_errors.txt
  )
)

echo Done.
pause
