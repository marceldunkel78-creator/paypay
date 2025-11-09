# PayPay Native Pi Deployment Commands

## Quick Native Deployment (No Docker!)

### 1. On Raspberry Pi - Clean Start
```bash
# Stop any Docker services if running
sudo systemctl stop docker 2>/dev/null || true

# Free up resources
sudo apt autoremove -y
sudo apt clean
```

### 2. Run Native Deployment
```bash
# SSH into Pi
ssh dunkel@raspberrypi

# Go to project directory
cd paypay

# Pull latest changes
git pull origin main

# Make script executable
chmod +x deploy-pi-native.sh

# Run native deployment (much lighter than Docker!)
./deploy-pi-native.sh localhost marceldunkel78@gmail.com
```

### 3. Post-Deployment
```bash
# Check if everything is running
pm2 list                              # Application status
sudo systemctl status mariadb         # Database status
sudo systemctl status nginx           # Web server status

# View logs
pm2 logs paypay                       # Application logs
sudo journalctl -u mariadb -f         # Database logs
sudo journalctl -u nginx -f           # Nginx logs

# Test the application
curl http://localhost:3000/health     # Direct app test
curl http://localhost/health          # Through nginx test
```

## System Resource Usage (Much Better!)

### Native vs Docker Comparison:
- **Native Node.js**: ~50-100MB RAM
- **Docker Stack**: ~300-500MB RAM + overhead
- **MariaDB Native**: ~50-80MB RAM
- **MySQL Docker**: ~150-200MB RAM + overhead

**Total Native**: ~150-200MB RAM
**Total Docker**: ~500-800MB RAM

## Management Commands

### Application Management:
```bash
pm2 status                    # Show app status
pm2 restart paypay           # Restart app
pm2 stop paypay              # Stop app
pm2 start paypay             # Start app
pm2 logs paypay              # View logs
pm2 monit                    # Real-time monitoring
```

### Database Management:
```bash
# Connect to database
mysql -u paypay -p paypay

# Database backup
mysqldump -u paypay -p paypay > backup.sql

# Database restore
mysql -u paypay -p paypay < backup.sql

# Check database status
sudo systemctl status mariadb
```

### Web Server Management:
```bash
# Nginx operations
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t                # Test configuration

# View access logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Email Configuration
After deployment, edit `/opt/paypay/.env`:
```bash
sudo nano /opt/paypay/.env

# Update these lines:
EMAIL_USER=marceldunkel78@gmail.com
EMAIL_PASS=your_gmail_app_password

# Restart app after changes
pm2 restart paypay
```

## SSL Setup (Optional)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (only if you have a real domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Troubleshooting

### App Won't Start:
```bash
# Check Node.js version
node --version                # Should be 18.x

# Check dependencies
cd /opt/paypay && npm ls

# Manual start for debugging
cd /opt/paypay && npm start
```

### Database Issues:
```bash
# Check MariaDB status
sudo systemctl status mariadb

# Reset database if needed
mysql -u root -p
DROP DATABASE paypay;
CREATE DATABASE paypay;

# Re-run migration
cd /opt/paypay && node scripts/migrate-complete.js
```

### Nginx Issues:
```bash
# Test configuration
sudo nginx -t

# Check if port 3000 is in use
sudo netstat -tulpn | grep :3000

# Reset nginx config if needed
sudo rm /etc/nginx/sites-enabled/paypay
sudo systemctl reload nginx
```

## Performance Monitoring
```bash
# System resources
htop                          # Interactive system monitor
free -h                       # Memory usage
df -h                         # Disk usage
iostat 1                      # I/O statistics

# Application monitoring
pm2 monit                     # PM2 monitoring dashboard
pm2 logs paypay --lines 100   # Recent logs
```

## Backup Script
```bash
#!/bin/bash
# Create daily backup
BACKUP_DIR="/home/dunkel/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u paypay -p paypay > $BACKUP_DIR/paypay_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/paypay_files_$DATE.tar.gz /opt/paypay/.env

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Quick Status Check
```bash
# All-in-one status check
echo "=== PayPay Status ===" && \
pm2 list && \
echo "" && \
sudo systemctl is-active mariadb && \
sudo systemctl is-active nginx && \
echo "" && \
curl -s http://localhost/health && \
echo " - App is responding"
```