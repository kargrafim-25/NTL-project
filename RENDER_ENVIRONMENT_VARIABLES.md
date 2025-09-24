# Render Environment Variables Configuration

## Required Environment Variables for Production Deployment

### Database Configuration
```
DATABASE_URL=your_postgresql_connection_string_here
```

### Authentication & Security
```
SESSION_SECRET=your_strong_session_secret_here
NODE_ENV=production
```

### API Keys
```
OPENAI_API_KEY=your_openai_api_key_here
BREVO_API_KEY=your_brevo_api_key_here
```

### Admin Configuration
```
ADMIN_EMAIL=your_admin_email_here
ADMIN_PASSWORD=your_admin_password_here
```

### Optional Environment Variables
```
FRONTEND_URL=https://your-app-name.onrender.com
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
- **Replace all placeholder values** with your actual credentials before deployment

## Security Considerations

- Never commit these values to your repository
- Use Render's environment variable system for secure storage
- Rotate API keys regularly
- Monitor usage of all API keys
