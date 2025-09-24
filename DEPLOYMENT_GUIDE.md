# NTL Trading Platform - Render Deployment Guide

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Database**: PostgreSQL database (provided by Render)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your repository contains:
- ✅ All source code
- ✅ `package.json` with correct dependencies
- ✅ `render.yaml` configuration file
- ✅ `RENDER_ENVIRONMENT_VARIABLES.md` with all required variables

### 2. Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ntl-trading-platform`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### 3. Set Environment Variables

In Render dashboard, go to Environment tab and add:

#### Required Variables:
```
DATABASE_URL=postgresql://ntl_database_user:pf39qfXxKNBmZYLYKWIWMS6NL2LnABzB@dpg-d36r8uumcj7s73e17rl0-a.oregon-postgres.render.com/ntl_database?sslmode=require
SESSION_SECRET=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
NODE_ENV=production
OPENAI_API_KEY=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
BREVO_API_KEY=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
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

#### Optional Variables:
```
FRONTEND_URL=https://your-app-name.onrender.com
ALPHA_VANTAGE_API_KEY=your_key_here
```

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the service
3. Monitor the deployment logs for any errors

### 5. Verify Deployment

1. **Health Check**: Visit `https://your-app.onrender.com/health`
2. **Database Connection**: Check logs for successful database connection
3. **API Endpoints**: Test key endpoints like `/api/v1/health`
4. **Frontend**: Verify the React app loads correctly

## Troubleshooting

### Common Issues:

#### 1. Build Failures
- Check `package.json` dependencies
- Ensure all required files are committed
- Verify build command in Render settings

#### 2. Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure SSL is properly configured

#### 3. Environment Variable Issues
- Double-check all required variables are set
- Verify no typos in variable names
- Ensure sensitive data is not in code

#### 4. CORS Issues
- Update `FRONTEND_URL` to match your actual domain
- Check CORS configuration in `server/index.ts`

### Debug Commands:

```bash
# Check service logs
# Available in Render dashboard under "Logs" tab

# Test health endpoint
curl https://your-app.onrender.com/health

# Test API endpoint
curl https://your-app.onrender.com/api/v1/health
```

## Post-Deployment

### 1. Update DNS (if using custom domain)
- Point your domain to Render's provided URL
- Update CORS settings if needed

### 2. Monitor Performance
- Check Render dashboard for metrics
- Monitor error logs
- Set up alerts for downtime

### 3. Security Checklist
- ✅ Environment variables are secure
- ✅ Database credentials are protected
- ✅ API keys are not exposed
- ✅ HTTPS is enabled (automatic on Render)

## Maintenance

### Regular Tasks:
1. Monitor application logs
2. Update dependencies regularly
3. Backup database data
4. Monitor API usage and costs
5. Review security logs

### Scaling:
- Upgrade Render plan for more resources
- Implement caching for better performance
- Consider CDN for static assets

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Application Logs**: Available in Render dashboard
- **Health Monitoring**: Use `/health` endpoint for monitoring

---

**Note**: This deployment guide assumes you're using the provided database credentials. Update them according to your actual Render PostgreSQL setup.