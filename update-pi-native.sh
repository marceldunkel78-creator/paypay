#!/bin/bash

# PayPay Pi Update Script
# Updates Node.js, npm, and PM2 to latest versions

set -e

echo "=== PayPay Pi Update Script ==="
echo "Updating Node.js, npm, and PM2 to latest versions..."

# Stop application if running
echo "Stopping application..."
pm2 stop paypay 2>/dev/null || true

# Update Node.js to latest LTS
echo "Updating Node.js to latest LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs

# Update npm to latest
echo "Updating npm to latest version..."
sudo npm install -g npm@latest

# Update PM2 to latest
echo "Updating PM2 to latest version..."
sudo npm install -g pm2@latest

# Update TypeScript support
echo "Updating TypeScript support..."
sudo npm install -g ts-node@latest typescript@latest

# Show updated versions
echo ""
echo "=== Updated Versions ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "TypeScript: $(tsc --version)"

# Update application dependencies
if [ -d "/opt/paypay" ]; then
    echo ""
    echo "Updating application dependencies..."
    cd /opt/paypay
    
    # Update dependencies
    npm update
    
    # Rebuild if needed
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        echo "Rebuilding application..."
        npm run build
    fi
    
    # Restart application
    echo "Restarting application..."
    pm2 restart paypay
    pm2 save
    
    echo "✓ Application updated and restarted"
else
    echo "⚠ Application directory /opt/paypay not found"
fi

echo ""
echo "=== Update Complete! ==="
echo "All components updated to latest versions"
echo ""
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs paypay"
echo ""