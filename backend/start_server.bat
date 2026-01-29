@echo off
cd /d D:\All_codes\galonline\backend
D:\All_codes\galonline\backend\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
