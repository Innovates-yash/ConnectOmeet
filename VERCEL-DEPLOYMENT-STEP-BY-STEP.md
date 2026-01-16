# 🚀 Complete Vercel Deployment Guide - GameVerse

## Step-by-Step Frontend Deployment on Vercel

### 📋 What You Need:
- GitHub account with your project
- Vercel account (free)
- Backend deployed (we'll do this after)

---

## 🎯 FRONTEND DEPLOYMENT (Vercel)

### Step 1: Import Project on Vercel

Based on your screenshot, fill in these fields:

#### **Vercel Team**
```
Select: gyash6991-gmailcom's... (or your team name)
```

#### **Project Name**
```
Fill in: gameverse-frontend
```
(Or keep: connect-omeet-g2j8)

#### **Framework Preset**
```
Select: Other
```
✅ **IMPORTANT**: Keep it as "Other" (already selected in your screenshot)

#### **Root Directory**
```
Click "Edit" button
Fill in: frontend
```
✅ **CRITICAL**: This tells Vercel to deploy only the frontend folder!

---

### Step 2: Build and Output Settings

Click on "Build and Output Settings" to expand it.

#### **Build Command**
```
npm run build
```
(Vercel usually auto-detects this)

#### **Output Directory**
```
dist
```
(Vercel usually auto-detects this for Vite)

#### **Install Command**
```
npm install
```
(Vercel usually auto-detects this)

---

### Step 3: Environment Variables

Click on "Environment Variables" to expand it.

#### **Remove the example variable**
- Click the "−" (minus) button next to "EXAMPLE_NAME"

#### **Add your environment variable**
Click "+ Add More" and fill in:

**Key:**
```
VITE_API_BASE_URL
```

**Value:**
```
http://localhost:8080/api/v1
```
(We'll update this after deploying the backend)

---

### Step 4: Deploy

Click the **"Deploy"** button at the bottom.

⏳ Wait 2-3 minutes for deployment to complete.

---

## ✅ After Frontend Deployment

You'll get a URL like:
```
https://gameverse-frontend.vercel.app
```

**BUT** it won't work fully yet because the backend isn't deployed!

---

## 🔧 BACKEND DEPLOYMENT (Railway - Recommended)

### Why Railway?
- ✅ Free tier available
- ✅ Automatic MySQL database
- ✅ Easy Java/Spring Boot deployment
- ✅ GitHub integration

### Step 1: Go to Railway

1. Visit: https://railway.app/
2. Click "Start a New Project"
3. Sign in with GitHub

### Step 2: Deploy Backend

1. Click "Deploy from GitHub repo"
2. Select your repository: `ConnectOmeet`
3. Click "Add variables" (we'll add these next)

### Step 3: Add Environment Variables

Click "Variables" tab and add these:

#### **SPRING_DATASOURCE_URL**
```
jdbc:mysql://mysql:3306/gameverse_db
```

#### **SPRING_DATASOURCE_USERNAME**
```
root
```

#### **SPRING_DATASOURCE_PASSWORD**
```
your_password_here
```

#### **JWT_SECRET**
```
your-super-secret-jwt-key-change-this-in-production-min-256-bits
```

#### **SERVER_PORT**
```
8080
```

### Step 4: Add MySQL Database

1. In Railway dashboard, click "+ New"
2. Select "Database"
3. Choose "MySQL"
4. Railway will create a MySQL instance

### Step 5: Get Database Connection Details

1. Click on the MySQL service
2. Go to "Variables" tab
3. Copy these values:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`

### Step 6: Update Backend Environment Variables

Update the backend variables with actual MySQL values:

**SPRING_DATASOURCE_URL**
```
jdbc:mysql://[MYSQL_HOST]:[MYSQL_PORT]/[MYSQL_DATABASE]
```

**SPRING_DATASOURCE_USERNAME**
```
[MYSQL_USER]
```

**SPRING_DATASOURCE_PASSWORD**
```
[MYSQL_PASSWORD]
```

### Step 7: Configure Build Settings

In Railway, go to Settings:

**Root Directory:**
```
backend
```

**Build Command:**
```
mvn clean package -DskipTests
```

**Start Command:**
```
java -jar target/*.jar
```

### Step 8: Deploy

Click "Deploy" and wait for build to complete (5-10 minutes).

You'll get a URL like:
```
https://your-backend.up.railway.app
```

---

## 🔗 CONNECT FRONTEND TO BACKEND

### Step 1: Copy Backend URL

From Railway, copy your backend URL:
```
https://your-backend.up.railway.app
```

### Step 2: Update Vercel Environment Variable

1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Find `VITE_API_BASE_URL`
5. Click "Edit"
6. Update value to:
```
https://your-backend.up.railway.app/api/v1
```
7. Click "Save"

### Step 3: Redeploy Frontend

1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for redeployment

---

## 🎉 TESTING YOUR DEPLOYMENT

### Test Frontend
1. Visit your Vercel URL
2. You should see the landing page
3. Click "Get Started" or go to `/auth`

### Test Backend
Visit in browser:
```
https://your-backend.up.railway.app/api/v1/health
```
(If you have a health endpoint)

### Test Full Flow
1. Go to your Vercel URL
2. Navigate to `/auth`
3. Enter phone number with country code
4. Click "Send OTP"
5. Enter OTP: `1234`
6. Should login successfully!

---

## 📝 QUICK REFERENCE - What to Fill

### Vercel (Frontend)
| Field | Value |
|-------|-------|
| Framework Preset | Other |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable Key | `VITE_API_BASE_URL` |
| Environment Variable Value | `https://your-backend.up.railway.app/api/v1` |

### Railway (Backend)
| Field | Value |
|-------|-------|
| Root Directory | `backend` |
| Build Command | `mvn clean package -DskipTests` |
| Start Command | `java -jar target/*.jar` |

### Environment Variables (Backend)
| Key | Value |
|-----|-------|
| SPRING_DATASOURCE_URL | `jdbc:mysql://[HOST]:[PORT]/[DATABASE]` |
| SPRING_DATASOURCE_USERNAME | From Railway MySQL |
| SPRING_DATASOURCE_PASSWORD | From Railway MySQL |
| JWT_SECRET | Your secret key (256+ bits) |
| SERVER_PORT | `8080` |

---

## 🐛 Common Issues & Solutions

### Issue 1: 404 NOT_FOUND on Vercel
**Solution**: Make sure `vercel.json` exists in frontend folder (already created)

### Issue 2: CORS Error
**Solution**: Update backend CORS to allow your Vercel domain:
```java
@CrossOrigin(origins = "https://your-app.vercel.app")
```

### Issue 3: Database Connection Failed
**Solution**: 
1. Check Railway MySQL is running
2. Verify environment variables are correct
3. Check database exists

### Issue 4: Build Failed on Railway
**Solution**:
1. Make sure Root Directory is set to `backend`
2. Check Java version (should be 17+)
3. Review build logs

---

## 📞 Need Help?

If something doesn't work:
1. Check Vercel deployment logs
2. Check Railway deployment logs
3. Verify all environment variables
4. Test backend URL directly in browser

---

## 🎯 Summary

1. ✅ Deploy Frontend on Vercel (Root: `frontend`)
2. ✅ Deploy Backend on Railway (Root: `backend`)
3. ✅ Add MySQL database on Railway
4. ✅ Update Vercel environment variable with backend URL
5. ✅ Redeploy frontend
6. ✅ Test the application!

**Your app should now be live!** 🚀
