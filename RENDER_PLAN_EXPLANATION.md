# Render Plan Configuration Explanation

## Why is there a specific plan in render.yaml?

The `plan: starter` in your `render.yaml` file specifies the **pricing tier** for your Render services. Here's what this means:

### Current Configuration:
```yaml
services:
  - type: web
    name: ntl-trading-platform
    plan: starter  # ← This sets the pricing tier

databases:
  - name: ntl-database
    plan: starter  # ← This sets the database pricing tier
```

## Render Plan Options:

### **Free Plan** (for testing/development):
- **Web Service**: Free tier available
- **Database**: Free tier available (limited)
- **Limitations**: 
  - Services sleep after 15 minutes of inactivity
  - Limited resources (512MB RAM, 0.1 CPU)
  - Database has limited storage and connections

### **Starter Plan** (recommended for production):
- **Web Service**: $7/month
- **Database**: $7/month
- **Features**:
  - Always-on (no sleeping)
  - 512MB RAM, 0.5 CPU
  - Better performance
  - More database storage and connections

### **Standard Plan** (for high traffic):
- **Web Service**: $25/month
- **Database**: $20/month
- **Features**:
  - 2GB RAM, 1 CPU
  - Better performance
  - More resources

## Your Options:

### Option 1: Keep Starter Plan (Recommended)
```yaml
plan: starter
```
- **Cost**: ~$14/month total
- **Best for**: Production apps with moderate traffic
- **Always-on**: No sleeping issues

### Option 2: Use Free Plan (For testing)
```yaml
plan: free
```
- **Cost**: $0/month
- **Limitations**: Services sleep after inactivity
- **Best for**: Testing and development

### Option 3: Remove Plan Specification
```yaml
# Remove the plan line entirely
```
- **Result**: Render will prompt you to choose during deployment
- **Flexibility**: You can select the plan in the dashboard

## Recommendation:

For a **production trading platform**, I recommend keeping the **Starter plan** because:

1. **Always-on**: Your trading signals need to be available 24/7
2. **Performance**: Better resources for AI signal generation
3. **Database**: More reliable database connections
4. **User Experience**: No cold start delays

## How to Change the Plan:

### Method 1: Edit render.yaml
```yaml
# For free tier
plan: free

# For starter tier (current)
plan: starter

# For standard tier
plan: standard
```

### Method 2: Remove from render.yaml
```yaml
# Remove these lines:
# plan: starter
```
Then choose the plan during deployment in Render dashboard.

## Cost Breakdown:
- **Free**: $0/month (with limitations)
- **Starter**: ~$14/month (web + database)
- **Standard**: ~$45/month (web + database)

**Your current configuration uses Starter plan, which is ideal for a production trading platform.**
