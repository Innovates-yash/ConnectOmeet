@echo off
echo Starting GameVerse Backend...
cd backend
set JAVA_HOME=C:\Program Files\Java\jdk-25
mvnw.cmd spring-boot:run -Dmaven.test.skip=true