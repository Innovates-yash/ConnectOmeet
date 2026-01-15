@echo off
echo Starting GameVerse Full-Stack Application...
echo.
echo Starting Backend (Port 8080)...
start "GameVerse Backend" cmd /k "cd backend && set JAVA_HOME=C:\Program Files\Java\jdk-25 && mvnw.cmd spring-boot:run -Dmaven.test.skip=true"

echo Waiting 30 seconds for backend to start...
timeout /t 30 /nobreak

echo Starting Frontend (Port 3000)...
start "GameVerse Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   GameVerse Platform Started!
echo ========================================
echo   Backend:  http://localhost:8080/api/v1
echo   Frontend: http://localhost:3000
echo   Swagger:  http://localhost:8080/swagger-ui.html
echo ========================================
echo.
pause