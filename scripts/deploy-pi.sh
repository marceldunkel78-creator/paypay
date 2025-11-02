#!/bin/bash

# ==============================================
# Raspberry Pi Deployment Script
# Complete setup for hosting on Raspberry Pi
# ==============================================

set -e

echo "🍓 Time Account App - Raspberry Pi Deployment"
echo "=============================================="

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo apt install docker-compose -y
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.production .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your actual values:"
    echo "   - Set your domain name"
    echo "   - Generate strong passwords"
    echo "   - Configure email settings"
    echo ""
    read -p "Press Enter when you've edited .env file..."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p backups

# Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R $USER:$USER .

# Build and start services
echo "🚀 Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "✅ Checking service status..."
docker-compose ps

# Test health endpoint
echo "🩺 Testing application health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "❌ Application health check failed"
    echo "📋 Checking logs..."
    docker-compose logs app
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Configure your router to forward ports 80 and 443"
echo "   2. Set up dynamic DNS if you have a dynamic IP"
echo "   3. Run './scripts/setup-ssl.sh' to enable HTTPS"
echo "   4. Test from outside your network"
echo ""
echo "🌐 Local access: http://localhost"
echo "🌐 External access: http://your-domain.com"