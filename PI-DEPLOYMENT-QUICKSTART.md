# PayPay Raspberry Pi Quick Setup Commands

## 1. Initial System Setup (run on Raspberry Pi)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget nano htop

# Enable SSH (if not already enabled)
sudo systemctl enable ssh
sudo systemctl start ssh
```

## 2. Transfer Files to Raspberry Pi
```bash
# From your development machine, transfer the project
scp -r C:/Users/marce/Documents/Programmierung/paypay pi@YOUR_PI_IP:/home/pi/

# Or use git clone if you have the code in a repository
# ssh pi@YOUR_PI_IP
# git clone https://github.com/yourusername/paypay.git
```

## 3. Run Deployment Script
```bash
# SSH into your Raspberry Pi
ssh pi@YOUR_PI_IP

# Navigate to project directory
cd /home/pi/paypay

# Make deployment script executable
chmod +x deploy-pi-final.sh

# Run deployment (replace with your actual domain and email)
./deploy-pi-final.sh your-domain.com your-email@example.com

# For local development without SSL:
./deploy-pi-final.sh localhost admin@localhost
```

## 4. Post-Deployment Verification
```bash
# Check if services are running
sudo docker-compose ps

# View logs if needed
sudo docker-compose logs

# Check system resources
htop
docker stats

# Test the application
curl http://localhost/health
```

## 5. Production Configuration
```bash
# Edit environment file if needed
nano .env.production

# Restart services after configuration changes
sudo docker-compose down
sudo docker-compose up -d

# Monitor logs
sudo docker-compose logs -f
```

## 6. Backup Setup (Recommended)
```bash
# Create backup script
cat > backup-paypay.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/pi/paypay-backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
sudo docker-compose exec -T db mysqldump -u root -p$MYSQL_ROOT_PASSWORD paypay > $BACKUP_DIR/paypay_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/paypay_files_$DATE.tar.gz .env.production nginx/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup-paypay.sh

# Schedule daily backups
echo "0 2 * * * /home/pi/paypay/backup-paypay.sh" | crontab -
```

## 7. Monitoring Commands
```bash
# System monitoring
htop                          # System resources
df -h                         # Disk usage
free -h                       # Memory usage
iostat 1                      # I/O statistics

# Docker monitoring
docker stats                  # Container resource usage
docker-compose logs           # Application logs
docker-compose logs -f app    # Follow app logs
docker system df              # Docker disk usage
docker system prune           # Clean up unused images/containers

# Application monitoring
curl http://localhost/health  # Health check
tail -f logs/app.log         # Application logs (if using file logging)
```

## 8. Troubleshooting Commands
```bash
# If services won't start
sudo docker-compose down
sudo docker-compose pull
sudo docker-compose up -d

# If database issues
sudo docker-compose exec db mysql -u root -p
# Then run: SHOW DATABASES; USE paypay; SHOW TABLES;

# If nginx issues
sudo docker-compose exec nginx nginx -t    # Test config
sudo docker-compose restart nginx          # Restart nginx

# View detailed logs
sudo docker-compose logs app
sudo docker-compose logs db
sudo docker-compose logs nginx

# Reset everything (CAREFUL - this deletes data!)
# sudo docker-compose down -v
# sudo docker system prune -a
```

## 9. Performance Optimization for Pi 3B
```bash
# Increase swap space (if needed)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=512/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# GPU memory split (for headless operation)
echo "gpu_mem=16" | sudo tee -a /boot/config.txt

# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable wifi-powersave@wlan0

# Reboot to apply changes
sudo reboot
```

## 10. Security Hardening
```bash
# Change default passwords
sudo passwd pi              # Change pi user password
# Change admin password in the web application

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Update system regularly
echo "0 4 * * 0 apt update && apt upgrade -y" | sudo crontab -e
```

## Quick Reference
- **Application URL**: http://YOUR_PI_IP (or https://your-domain.com)
- **Default Admin**: admin / admin123 (change immediately!)
- **SSH Access**: ssh pi@YOUR_PI_IP
- **Logs**: `sudo docker-compose logs`
- **Restart**: `sudo docker-compose restart`
- **Stop**: `sudo docker-compose down`
- **Start**: `sudo docker-compose up -d`