@echo off
setlocal

rem find count using Python (works if top-level JSON is an array)
for /f "usebackq delims=" %%N in (`py -3 -c "import json; print(len(json.load(open(r'UCOInfo\\full Course Desription.json','r',encoding='utf-8'))))"`) do set COUNT=%%N

if "%COUNT%"=="" set COUNT=0
if %COUNT% LEQ 0 (
  echo No courses found
  exit /b 0
)

if not exist ".\output" mkdir ".\output"

for /L %%i in (0,1,%COUNT%-1) do (
  echo Running index %%i
  py -3 .\scripts\ollama_infer_course.py %%i >> .\output\all_extractors_output.log 2>&1
  if errorlevel 1 echo Error on index %%i >> .\output\ollama_course_skills_errors.txt
)

echo Done
pause