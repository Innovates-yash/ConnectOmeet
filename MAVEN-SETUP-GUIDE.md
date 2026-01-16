# Complete Maven Setup Guide for Windows

## Prerequisites

First, you need Java JDK installed. Let's check and install if needed.

---

## Step 1: Install Java JDK (if not already installed)

### Check if Java is installed:

1. Open **Command Prompt** (Win + R, type `cmd`, press Enter)
2. Type: `java -version`
3. If you see a version number, Java is installed. Skip to Step 2.
4. If you get an error, continue below.

### Install Java JDK:

1. **Download Java JDK 17 or higher:**
   - Go to: https://www.oracle.com/java/technologies/downloads/
   - OR use OpenJDK: https://adoptium.net/temurin/releases/
   
2. **For Adoptium (Recommended - Free):**
   - Go to: https://adoptium.net/temurin/releases/
   - Select:
     - **Version**: 17 (LTS) or 21 (LTS)
     - **Operating System**: Windows
     - **Architecture**: x64
   - Click **Download .msi**

3. **Install Java:**
   - Run the downloaded `.msi` file
   - Click **Next** through the installer
   - ✅ **IMPORTANT**: Check the box "Add to PATH" or "Set JAVA_HOME"
   - Click **Install**
   - Click **Finish**

4. **Verify Installation:**
   - Open a **NEW** Command Prompt (close old one)
   - Type: `java -version`
   - You should see: `openjdk version "17.x.x"` or similar

---

## Step 2: Download Maven

1. **Go to Maven Download Page:**
   - Visit: https://maven.apache.org/download.cgi

2. **Download Binary Zip:**
   - Look for **"Binary zip archive"**
   - Click: `apache-maven-3.9.6-bin.zip` (or latest version)
   - Save to your Downloads folder

---

## Step 3: Extract Maven

1. **Create Maven Directory:**
   - Open File Explorer
   - Navigate to: `C:\Program Files\`
   - Create a new folder: `Maven`
   - Full path: `C:\Program Files\Maven\`

2. **Extract Maven:**
   - Go to your Downloads folder
   - Right-click on `apache-maven-3.9.6-bin.zip`
   - Select **"Extract All..."**
   - Extract to: `C:\Program Files\Maven\`
   - You should now have: `C:\Program Files\Maven\apache-maven-3.9.6\`

---

## Step 4: Set Environment Variables

### Set MAVEN_HOME:

1. **Open Environment Variables:**
   - Press **Win + R**
   - Type: `sysdm.cpl`
   - Press **Enter**
   - Click **"Advanced"** tab
   - Click **"Environment Variables..."** button

2. **Create MAVEN_HOME Variable:**
   - In **"System variables"** section (bottom half)
   - Click **"New..."**
   - Variable name: `MAVEN_HOME`
   - Variable value: `C:\Program Files\Maven\apache-maven-3.9.6`
   - Click **OK**

### Add Maven to PATH:

1. **Edit PATH Variable:**
   - In **"System variables"** section
   - Find and select **"Path"**
   - Click **"Edit..."**
   - Click **"New"**
   - Add: `%MAVEN_HOME%\bin`
   - Click **OK**
   - Click **OK** on all windows

---

## Step 5: Verify Maven Installation

1. **Close ALL Command Prompt windows**

2. **Open a NEW Command Prompt:**
   - Press **Win + R**
   - Type: `cmd`
   - Press **Enter**

3. **Check Maven Version:**
   ```bash
   mvn -version
   ```

4. **You should see output like:**
   ```
   Apache Maven 3.9.6
   Maven home: C:\Program Files\Maven\apache-maven-3.9.6
   Java version: 17.0.x
   ```

---

## Step 6: Run Your Backend

Now you can run the backend from command line:

1. **Navigate to backend folder:**
   ```bash
   cd "C:\Users\Yash Gupta\IdeaProjects\ConnectOMeet\backend"
   ```

2. **Clean and install dependencies:**
   ```bash
   mvn clean install
   ```
   (This will take a few minutes the first time)

3. **Run the backend:**
   ```bash
   mvn spring-boot:run
   ```

4. **Wait for:**
   ```
   Started GameVerseApplication in X seconds
   ```

5. **Backend is now running on:**
   ```
   http://localhost:8080
   ```

---

## Troubleshooting

### "mvn is not recognized"
- Make sure you closed and reopened Command Prompt after setting PATH
- Verify PATH contains: `%MAVEN_HOME%\bin`
- Check MAVEN_HOME points to correct folder

### "JAVA_HOME not set"
1. Open Environment Variables again
2. Create new System variable:
   - Name: `JAVA_HOME`
   - Value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x` (or your Java path)
3. Restart Command Prompt

### "Port 8080 already in use"
```bash
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

---

## Quick Reference

### Maven Commands:
```bash
mvn clean              # Clean build artifacts
mvn compile            # Compile the code
mvn test               # Run tests
mvn package            # Create JAR file
mvn install            # Install to local repository
mvn spring-boot:run    # Run Spring Boot application
```

### Check Versions:
```bash
java -version          # Check Java version
mvn -version           # Check Maven version
```

---

## Alternative: Use IntelliJ IDEA (Easier!)

If this seems complicated, IntelliJ IDEA has Maven built-in:

1. Open IntelliJ IDEA
2. Open `backend` folder
3. Right-click `GameVerseApplication.java`
4. Click **"Run"**

IntelliJ will handle Maven automatically! 🚀

---

**Need Help?** Let me know which step you're stuck on!
