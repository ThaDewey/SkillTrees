@echo off
set "PATH=C:\Users\YOURNAME\AppData\Local\Programs\ollama;%PATH%"
py -3 .\scripts\ollama_infer_course.py %1
pause
