# How to Run the Backend

## ✅ Easiest Method: Run from IntelliJ IDEA

Since you have IntelliJ IDEA open, this is the simplest way:

### Steps:

1. **Open IntelliJ IDEA** (if not already open)

2. **Open the Backend Project:**
   - File → Open
   - Navigate to: `C:\Users\Yash Gupta\IdeaProjects\ConnectOMeet\backend`
   - Click OK

3. **Wait for Maven to sync** (bottom right corner will show progress)

4. **Run the Application:**
   - In the Project Explorer, navigate to:
     ```
     backend/src/main/java/com/gameverse/GameVerseApplication.java
     ```
   - Right-click on `GameVerseApplication.java`
   - Select **"Run 'GameVerseApplication'"**
   
   OR
   
   - Click the green play button (▶) next to the `main` method in the file

5. **Check the Console:**
   - You should see Spring Boot starting up
   - Wait for: `Started GameVerseApplication in X seconds`
   - Backend will be running on: **http://localhost:8080**

---

## Alternative: Install Maven and Java

If you want to run from command line:

### 1. Install Java JDK 17+

Download from: https://www.oracle.com/java/technologies/downloads/

Or use OpenJDK: https://adoptium.net/

### 2. Install Maven

Download from: https://maven.apache.org/download.cgi

Extract and add to PATH:
```
C:\Program Files\apache-maven-3.x.x\bin
```

### 3. Run Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

---

## Verify Backend is Running

Once started, test these endpoints:

1. **Health Check:**
   ```
   http://localhost:8080/api/v1/health
   ```
   (Will return 401 - that's OK, means it's running)

2. **Send OTP (Public endpoint):**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/send-otp \
     -H "Content-Type: application/json" \
     -d "{\"phoneNumber\":\"+1234567890\"}"
   ```

---

## Current Status

- ✅ **Frontend**: Running on http://localhost:3000/
- ⏳ **Backend**: Needs to be started from IntelliJ IDEA
- ✅ **Database**: MySQL should be running

---

## Troubleshooting

### "Port 8080 already in use"
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### "Cannot connect to database"
- Make sure MySQL is running
- Check credentials in `backend/src/main/resources/application.yml`
- Default: username=root, password=your_password, database=gameverse_db

---

**Recommended: Use IntelliJ IDEA to run the backend - it's the easiest way!** 🚀
