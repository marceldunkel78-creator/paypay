# 🍓 Raspberry Pi Deployment Guide

## Complete guide to host your Time Account Management app on Raspberry Pi and make it accessible from the internet.

---

## 📋 Prerequisites

### Hardware Requirements
- **Raspberry Pi 4** (recommended) or Pi 3B+
- **32GB+ SD card** (Class 10 or better)
- **Stable internet connection**
- **External storage** (optional, for backups)

### Network Requirements
- **Router with port forwarding capability**
- **Static local IP** for Raspberry Pi
- **Domain name** (recommended) or Dynamic DNS

---

## 🚀 Quick Deployment

### 1. Prepare Raspberry Pi

```bash
# Install Raspberry Pi OS (64-bit recommended)
# SSH into your Pi or use terminal

# Clone your repository
git clone https://github.com/marceldunkel78-creator/paypay.git
cd paypay

# Make scripts executable
chmod +x scripts/*.sh
```

### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.production .env
nano .env

# Set these variables:
# - DOMAIN_NAME=yourdomain.com
# - Strong passwords for database
# - Email configuration
# - Admin emails
```

### 3. Deploy Application

```bash
# Run automated deployment
./scripts/deploy-pi.sh

# This will:
# - Install Docker & Docker Compose
# - Build optimized ARM images
# - Start all services
# - Run health checks
```

### 4. Configure Network

#### A. Router Configuration
1. **Set Static IP** for Raspberry Pi in router
2. **Port Forwarding**:
   - Port 80 → Pi IP:80 (HTTP)
   - Port 443 → Pi IP:443 (HTTPS)

#### B. Domain Setup
1. **Domain DNS**: Point A record to your public IP
2. **Dynamic DNS** (if dynamic IP): Use services like DuckDNS, No-IP

### 5. Enable HTTPS

```bash
# After domain is pointing to your Pi
./scripts/setup-ssl.sh

# This will:
# - Get Let's Encrypt certificates
# - Configure SSL in nginx
# - Set up automatic renewal
```

---

## 🔧 Manual Configuration

### Docker Compose Services

- **app**: Your Node.js application
- **mysql**: Database with persistent storage
- **nginx**: Reverse proxy with SSL termination
- **certbot**: SSL certificate management

### Key Features

- ✅ **ARM64 optimized** Docker images
- ✅ **Health checks** and automatic restarts
- ✅ **SSL/HTTPS** with Let's Encrypt
- ✅ **Rate limiting** and security headers
- ✅ **Automated backups**
- ✅ **Log management**

---

## 🛡️ Security Considerations

### Essential Security Steps

1. **Change default passwords**:
   ```bash
   # SSH password
   passwd
   
   # Database passwords in .env
   nano .env
   ```

2. **Enable SSH key authentication**:
   ```bash
   # Copy your public key
   ssh-copy-id pi@your-pi-ip
   
   # Disable password auth
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

3. **Firewall setup**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```

4. **Regular updates**:
   ```bash
   # System updates
   sudo apt update && sudo apt upgrade -y
   
   # Container updates
   docker-compose pull
   docker-compose up -d
   ```

---

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f nginx

# Check resource usage
docker stats
```

### Automated Backups

```bash
# Manual backup
./scripts/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * cd /path/to/app && ./scripts/backup.sh
```

### SSL Certificate Renewal

```bash
# Test renewal
docker-compose run --rm certbot renew --dry-run

# Manual renewal (if needed)
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## 🌐 Access Your Application

### Local Network
- **HTTP**: `http://raspberry-pi-ip`
- **HTTPS**: `https://raspberry-pi-ip` (after SSL setup)

### Internet Access
- **HTTP**: `http://yourdomain.com`
- **HTTPS**: `https://yourdomain.com`

### Admin Panel
- Login with admin credentials
- Manage users and time accounts
- View system statistics

---

## 🔧 Troubleshooting

### Common Issues

#### App won't start
```bash
# Check logs
docker-compose logs app

# Common fixes
docker-compose down
docker-compose up -d
```

#### Can't access from internet
1. **Check port forwarding** in router
2. **Verify domain DNS** settings
3. **Test local access** first
4. **Check firewall** rules

#### Database connection issues
```bash
# Reset database
docker-compose down
docker volume rm paypay_mysql-data
docker-compose up -d
```

#### SSL certificate issues
```bash
# Check certificate status
docker-compose run --rm certbot certificates

# Renew certificates
./scripts/setup-ssl.sh
```

---

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### System Maintenance

```bash
# Clean Docker
docker system prune -a

# Update system
sudo apt update && sudo apt upgrade -y

# Restart services
docker-compose restart
```

---

## 💡 Performance Tips

### Raspberry Pi Optimization

1. **Use SSD instead of SD card** for better I/O
2. **Enable GPU memory split**: `sudo raspi-config`
3. **Overclock safely** if needed
4. **Monitor temperature**: `vcgencmd measure_temp`

### Application Optimization

1. **Configure nginx caching**
2. **Database optimization**
3. **Log rotation**
4. **Regular cleanup**

---

## 📞 Support

If you encounter issues:

1. **Check logs** first: `docker-compose logs`
2. **Review configuration** files
3. **Test network connectivity**
4. **Verify DNS settings**

---

## 🎉 Congratulations!

Your Time Account Management application is now running on Raspberry Pi and accessible from anywhere in the world! 

**What you've achieved:**
- ✅ Professional Docker deployment
- ✅ SSL/HTTPS security
- ✅ Automatic backups
- ✅ Internet accessibility
- ✅ Production-ready setup