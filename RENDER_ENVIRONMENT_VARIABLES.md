# Render Environment Variables Configuration

## Required Environment Variables for Production Deployment

### Database Configuration
```
DATABASE_URL=postgresql://ntl_database_user:pf39qfXxKNBmZYLYKWIWMS6NL2LnABzB@dpg-d36r8uumcj7s73e17rl0-a.oregon-postgres.render.com/ntl_database?sslmode=require
```

### Authentication & Security
```
SESSION_SECRET=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
NODE_ENV=production
```

### API Keys
```
OPENAI_API_KEY=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
BREVO_API_KEY=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
```

### Admin Configuration
```
ADMIN_EMAIL=admin@nextradinglabs.com
ADMIN_PASSWORD=K@rimadmin2509**
```

### Optional Environment Variables
```
FRONTEND_URL=https://ntl-project-v1.onrender.com
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add each variable with its value
5. Click "Save Changes"
6. Redeploy your service

## Important Notes

- **DATABASE_URL**: Use the external URL provided by Render PostgreSQL
- **SESSION_SECRET**: Use a strong, unique secret (32+ characters)
- **NODE_ENV**: Must be set to "production" for production deployment
- **FRONTEND_URL**: Update this to match your actual Render app URL
- All API keys should be kept secure and not committed to version control

## Security Considerations

- Never commit these values to your repository
- Use Render's environment variable system for secure storage
- Rotate API keys regularly
- Monitor usage of all API keys
