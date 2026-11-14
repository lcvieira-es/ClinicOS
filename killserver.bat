@echo off
taskkill /F /PID 9604
taskkill /F /PID 15168
taskkill /F /PID 1660
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*"
echo done
