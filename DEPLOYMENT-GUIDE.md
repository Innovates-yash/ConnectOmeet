# Deployment Guide - GameVerse

## 🚀 Vercel Deployment (Frontend)

### Prerequisites
- Vercel account
- Backend deployed and accessible via HTTPS

### Steps

1. **Update Environment Variables**
   
   In Vercel dashboard, add environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api/v1
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   ```
   
   Or connect your GitHub repo to Vercel for automatic deployments.

3. **Vercel Configuration**
   
   The `vercel.json` file is already configured to handle React Router:
   - All routes redirect to `index.html`
   - CORS headers configured for API calls

### Important Files Created

- `frontend/vercel.json` - Vercel configuration for routing
- `frontend/public/_redirects` - Fallback routing rules
- `frontend/.env.production` - Production environment variables
- `frontend/.env.development` - Development environment variables

## 🔧 Backend Deployment Options

### Option 1: Railway
1. Create Railway account
2. Connect GitHub repo
3. Select `backend` folder as root
4. Add environment variables (MySQL connection)
5. Deploy

### Option 2: Render
1. Create Render account
2. New Web Service
3. Connect GitHub repo
4. Build command: `cd backend && mvn clean package`
5. Start command: `java -jar target/*.jar`
6. Add environment variables

### Option 3: Heroku
1. Create Heroku account
2. Install Heroku CLI
3. Deploy:
   ```bash
   cd backend
   heroku create your-app-name
   heroku addons:create jawsdb:kitefin
   git push heroku main
   ```

### Option 4: AWS Elastic Beanstalk
1. Package application: `mvn clean package`
2. Create Elastic Beanstalk application
3. Upload JAR file
4. Configure RDS MySQL database
5. Set environment variables

## 🗄️ Database Deployment

### Option 1: Railway MySQL
- Automatic MySQL instance
- Get connection string from Railway dashboard
- Update backend `application.yml`

### Option 2: AWS RDS
- Create MySQL RDS instance
- Configure security groups
- Update connection string in backend

### Option 3: PlanetScale
- Free MySQL database
- Serverless and scalable
- Get connection string
- Update backend configuration

## 📝 Post-Deployment Checklist

### Frontend
- [ ] Vercel deployment successful
- [ ] Environment variable `VITE_API_BASE_URL` set
- [ ] All routes working (no 404 errors)
- [ ] API calls reaching backend
- [ ] Authentication flow working

### Backend
- [ ] Backend deployed and accessible
- [ ] Database connected
- [ ] Environment variables configured
- [ ] CORS configured for frontend domain
- [ ] Health check endpoint responding

### Database
- [ ] Schema created
- [ ] Migrations run successfully
- [ ] Seed data loaded (optional)
- [ ] Backups configured

## 🔐 Environment Variables

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://your-backend.com/api/v1
```

### Backend
```
SPRING_DATASOURCE_URL=jdbc:mysql://host:port/database
SPRING_DATASOURCE_USERNAME=username
SPRING_DATASOURCE_PASSWORD=password
JWT_SECRET=your-secret-key
```

## 🐛 Common Issues

### 404 NOT_FOUND on Vercel
**Solution**: Ensure `vercel.json` exists with proper rewrites configuration.

### CORS Errors
**Solution**: Update backend CORS configuration to allow your Vercel domain:
```java
@CrossOrigin(origins = "https://your-app.vercel.app")
```

### API Calls Failing
**Solution**: 
1. Check `VITE_API_BASE_URL` is set correctly
2. Verify backend is accessible
3. Check browser console for errors

### Database Connection Failed
**Solution**:
1. Verify database credentials
2. Check database is accessible from backend server
3. Ensure database exists and schema is created

## 📊 Monitoring

### Frontend (Vercel)
- Vercel Analytics (built-in)
- Error tracking: Sentry
- Performance: Vercel Speed Insights

### Backend
- Application logs
- Database monitoring
- API response times
- Error tracking

## 🔄 CI/CD

### Automatic Deployments
1. Connect GitHub to Vercel (frontend)
2. Connect GitHub to Railway/Render (backend)
3. Push to main branch triggers deployment

### Manual Deployments
```bash
# Frontend
cd frontend
npm run build
vercel --prod

# Backend
cd backend
mvn clean package
# Upload JAR to your hosting service
```

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check backend application logs
3. Verify environment variables
4. Test API endpoints directly

---

**Note**: Remember to update the backend URL in `.env.production` after deploying your backend!
