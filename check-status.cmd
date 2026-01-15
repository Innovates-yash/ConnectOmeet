@echo off
echo ========================================
echo   GameVerse Platform Status Check
echo ========================================
echo.

echo Checking Frontend (Port 3000)...
curl -s -o nul -w "Frontend Status: %%{http_code}" http://localhost:3000
echo.

echo Checking Backend (Port 8080)...
curl -s -o nul -w "Backend Status: %%{http_code}" http://localhost:8080/api/v1
echo.

echo Checking Database Connection...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pgyash4841@ -e "SELECT 'Database Connected!' as status;" gameverse_db 2>nul
if %errorlevel% equ 0 (
    echo Database: Connected
) else (
    echo Database: Connection Failed
)

echo.
echo ========================================
echo   Access URLs:
echo ========================================
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080/api/v1
echo   Swagger:  http://localhost:8080/swagger-ui.html
echo ========================================
pause