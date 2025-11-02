#!/bin/bash

# ==============================================
# SSL Setup Script for Let's Encrypt
# ==============================================

set -e

echo "🔒 Setting up SSL certificates with Let's Encrypt"
echo "================================================"

# Check if domain is configured
if ! grep -q "your-domain.com" .env; then
    echo "❌ Please configure your domain in .env file first!"
    exit 1
fi

# Source environment variables
source .env

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ DOMAIN_NAME not set in .env file!"
    exit 1
fi

echo "🌐 Setting up SSL for domain: $DOMAIN_NAME"

# First, get staging certificate to test
echo "🧪 Getting staging certificate for testing..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email $ADMIN_EMAIL_1 \
    --agree-tos \
    --no-eff-email \
    --staging \
    -d $DOMAIN_NAME

# Test if staging worked
if [ $? -eq 0 ]; then
    echo "✅ Staging certificate obtained successfully!"
    
    # Get production certificate
    echo "🔒 Getting production certificate..."
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/html \
        --email $ADMIN_EMAIL_1 \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $DOMAIN_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Production certificate obtained!"
        
        # Update nginx configuration
        echo "🔧 Updating nginx configuration..."
        sed -i "s/your-domain.com/$DOMAIN_NAME/g" nginx/conf.d/app-ssl.conf
        sed -i 's/^#[[:space:]]*//' nginx/conf.d/app-ssl.conf
        
        # Add redirect to HTTP config
        sed -i 's|# return 301|return 301|' nginx/conf.d/app.conf
        
        # Restart nginx
        docker-compose restart nginx
        
        echo "✅ SSL setup complete!"
        echo "🌐 Your site is now available at: https://$DOMAIN_NAME"
        
        # Set up automatic renewal
        echo "⏰ Setting up automatic certificate renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * cd $(pwd) && docker-compose run --rm certbot renew --quiet && docker-compose restart nginx") | crontab -
        
        echo "✅ Automatic renewal configured!"
    else
        echo "❌ Failed to obtain production certificate"
        exit 1
    fi
else
    echo "❌ Failed to obtain staging certificate"
    echo "💡 Make sure:"
    echo "   - Your domain points to this server's IP"
    echo "   - Ports 80 and 443 are open"
    echo "   - The application is running"
    exit 1
fi