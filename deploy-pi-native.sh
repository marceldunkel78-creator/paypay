#!/bin/bash

# PayPay Native Deployment Script for Raspberry Pi 3B
# Direct Node.js + MariaDB installation without Docker

set -e

echo "=== PayPay Native Pi Deployment Script ==="
echo "Starting native deployment process..."

# Configuration
DOMAIN=${1:-"localhost"}
EMAIL=${2:-"admin@localhost"}
DB_NAME="paypay"
DB_USER="paypay"
DB_PASSWORD=${3:-$(openssl rand -base64 16)}
DB_ROOT_PASSWORD=${4:-$(openssl rand -base64 16)}

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Database: $DB_NAME"
echo "DB User: $DB_USER"
echo "DB Password: $DB_PASSWORD"

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MariaDB
echo "Installing MariaDB..."
sudo apt install -y mariadb-server mariadb-client

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Install additional packages
sudo apt install -y nginx curl wget git

# Configure MariaDB
echo "Configuring MariaDB..."
sudo mysql -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('$DB_ROOT_PASSWORD');"
sudo mysql -u root -p$DB_ROOT_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -u root -p$DB_ROOT_PASSWORD -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -u root -p$DB_ROOT_PASSWORD -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -u root -p$DB_ROOT_PASSWORD -e "FLUSH PRIVILEGES;"

# Remember current directory (where git repo is)
REPO_DIR=$(pwd)

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p /opt/paypay
sudo chown $USER:$USER /opt/paypay

# Copy application files to deployment directory
echo "Copying application files..."
cp -r $REPO_DIR/* /opt/paypay/
cp -r $REPO_DIR/.* /opt/paypay/ 2>/dev/null || true

# Change to deployment directory
cd /opt/paypay

# Create environment file
echo "Creating environment file..."
cat > .env << EOF
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

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

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm ci --only=production

# Build the application
echo "Building application..."
npm run build

# Run database migration
echo "Setting up database..."
node scripts/migrate-complete.js

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/paypay << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/paypay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start application with PM2
echo "Starting application..."
pm2 delete paypay 2>/dev/null || true
pm2 start src/server.ts --name paypay --interpreter-args="--require ts-node/register"
pm2 save
pm2 startup

# Create admin user
echo "Creating admin user..."
sleep 5  # Wait for app to fully start
node scripts/create-admin.js

# Configure MariaDB to start on boot
sudo systemctl enable mariadb

echo ""
echo "=== Native Deployment Complete! ==="
echo ""
echo "Your PayPay application is now running natively!"
echo ""
echo "Access your application at: http://$DOMAIN"
echo "Local access: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Default admin credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Database credentials:"
echo "Root password: $DB_ROOT_PASSWORD"
echo "App user password: $DB_PASSWORD"
echo ""
echo "System Services:"
echo "- Application: pm2 list"
echo "- Database: sudo systemctl status mariadb"
echo "- Web server: sudo systemctl status nginx"
echo ""
echo "Important next steps:"
echo "1. Change the admin password immediately"
echo "2. Configure email settings in .env"
echo "3. Set up SSL with certbot (optional)"
echo "4. Configure firewall: sudo ufw enable && sudo ufw allow 80 && sudo ufw allow 22"
echo ""
echo "For troubleshooting:"
echo "- Application logs: pm2 logs paypay"
echo "- Database logs: sudo journalctl -u mariadb"
echo "- Nginx logs: sudo journalctl -u nginx"
echo "- System monitoring: htop, pm2 monit"
echo ""