#!/bin/bash

# Preview script for NTL Trading Platform
echo "🚀 Starting NTL Trading Platform Preview..."

# Set environment variables for local development
export SESSION_SECRET="local-development-secret-key"
export NODE_ENV="development"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="admin123"
export FRONTEND_URL="http://localhost:5173"

# Set a fallback DATABASE_URL if not provided
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://preview:preview@localhost:5432/preview"
    echo "⚠️  Using fallback DATABASE_URL for preview mode"
fi

echo "📋 Environment configured:"
echo "   NODE_ENV: $NODE_ENV"
echo "   SESSION_SECRET: [SET]"
echo "   ADMIN_EMAIL: $ADMIN_EMAIL"
echo "   DATABASE_URL: $DATABASE_URL"

echo ""
echo "🌐 Starting development server..."
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo ""

# Start the development server
npm run dev
