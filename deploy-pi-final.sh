#!/bin/bash

# PayPay Final Deployment Script for Raspberry Pi 3B
# Run this script on your Raspberry Pi after initial system setup

set -e

echo "=== PayPay Raspberry Pi Deployment Script ==="
echo "Starting deployment process..."

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"your-email@example.com"}
MYSQL_ROOT_PASSWORD=${3:-$(openssl rand -base64 32)}
MYSQL_DATABASE="paypay"
MYSQL_USER="paypay"
MYSQL_PASSWORD=${4:-$(openssl rand -base64 32)}

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "MySQL Root Password: $MYSQL_ROOT_PASSWORD"
echo "MySQL User Password: $MYSQL_PASSWORD"

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

echo "Installing Docker Compose..."
# Modern method for Raspberry Pi OS (Bookworm)
if command -v apt &> /dev/null; then
    # Try apt package manager first (recommended)
    sudo apt update
    sudo apt install -y docker-compose-plugin
    
    # If that fails, try the standalone version
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "Installing Docker Compose standalone..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
else
    # Fallback for older systems
    sudo pip3 install docker-compose --break-system-packages
fi

# Verify installation
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose installed successfully (standalone)"
    docker-compose --version
elif docker compose version &> /dev/null; then
    echo "✓ Docker Compose plugin installed successfully"
    docker compose version
    # Create symlink for compatibility
    sudo ln -sf /usr/bin/docker /usr/local/bin/docker-compose
    echo '#!/bin/bash' | sudo tee /usr/local/bin/docker-compose > /dev/null
    echo 'docker compose "$@"' | sudo tee -a /usr/local/bin/docker-compose > /dev/null
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✗ Docker Compose installation failed"
    exit 1
fi

# Remember current directory (where git repo is)
REPO_DIR=$(pwd)

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p /opt/paypay
sudo chown $USER:$USER /opt/paypay

# Copy application files to deployment directory
echo "Copying application files..."
cp -r $REPO_DIR/* /opt/paypay/
cp -r $REPO_DIR/.* /opt/paypay/ 2>/dev/null || true  # Copy hidden files, ignore errors

# Change to deployment directory
cd /opt/paypay

echo "Setting up application files..."

# Create production environment file
echo "Creating production environment file..."
cat > .env << EOF
NODE_ENV=production
PORT=3000

# Database
DB_HOST=db
DB_PORT=3306
DB_NAME=$MYSQL_DATABASE
DB_USER=$MYSQL_USER
DB_PASSWORD=$MYSQL_PASSWORD

# MySQL Root
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD

# Security
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)

# Email (configure as needed)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PayPay <noreply@$DOMAIN>

# Application
ADMIN_PASSWORD=admin123
DOMAIN=$DOMAIN
EOF

# Set up SSL if domain is provided and not default
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo "Setting up SSL configuration..."
    
    # Copy SSL template and replace domain
    cp nginx/conf.d/ssl.conf.template nginx/conf.d/ssl.conf
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/ssl.conf
    
    # Create directories for Let's Encrypt
    sudo mkdir -p /var/www/html/.well-known/acme-challenge
    sudo chown -R www-data:www-data /var/www/html
    
    echo "SSL configuration prepared. You'll need to run certbot after the initial deployment."
fi

# Build and start services
echo "Building Docker images..."
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

sudo $DOCKER_COMPOSE -f docker-compose.yml build

echo "Starting services..."
sudo $DOCKER_COMPOSE -f docker-compose.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Check if services are running
echo "Checking service status..."
sudo $DOCKER_COMPOSE -f docker-compose.yml ps

# Test application
echo "Testing application..."
if curl -f http://localhost/health; then
    echo "✓ Application is responding"
else
    echo "✗ Application is not responding"
    exit 1
fi

# Set up SSL certificate if domain is configured
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo "Setting up SSL certificate..."
    
    # Install certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Get certificate
    sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Set up auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    # Restart nginx with SSL
    sudo $DOCKER_COMPOSE restart nginx
fi

# Create admin user
echo "Creating admin user..."
sudo $DOCKER_COMPOSE exec app node scripts/create-admin.js

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Your PayPay application is now running!"
echo ""
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo "Access your application at: https://$DOMAIN"
else
    echo "Access your application at: http://$(hostname -I | awk '{print $1}')"
fi
echo ""
echo "Default admin credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Database credentials:"
echo "Root password: $MYSQL_ROOT_PASSWORD"
echo "App user password: $MYSQL_PASSWORD"
echo ""
echo "Important next steps:"
echo "1. Change the admin password immediately"
echo "2. Configure email settings in .env"
echo "3. Set up regular backups"
echo "4. Monitor system resources"
echo ""
echo "For troubleshooting, check: $DOCKER_COMPOSE logs"
echo "For system monitoring, use: htop, docker stats"
echo ""