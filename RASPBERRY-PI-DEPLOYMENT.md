# 🍓 PayPay Raspberry Pi Deployment Guide

Diese Anleitung führt Sie durch das komplette Deployment von PayPay auf einem Raspberry Pi 3B.

## 📋 Voraussetzungen

### Hardware
- Raspberry Pi 3B oder neuer
- microSD-Karte (32GB+ empfohlen)
- Internetverbindung

### Software
- Raspberry Pi OS (64-bit empfohlen)
- SSH-Zugang zum Pi

## 🚀 1. Raspberry Pi Vorbereitung

### System Update
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### Git installieren
```bash
sudo apt install git -y
```

## 📥 2. Repository klonen

```bash
cd ~
git clone https://github.com/marceldunkel78-creator/paypay.git
cd paypay
```

## 🔧 3. Konfiguration

### Environment-Datei erstellen
```bash
cp .env.production .env
nano .env
```

**Wichtige Einstellungen in .env:**
```bash
# Ihr Domain-Name oder IP
DOMAIN_NAME=192.168.1.100  # Oder ihre Domain

# Starke Passwörter generieren
DB_PASSWORD=IhrSicheresDBPasswort123!
DB_ROOT_PASSWORD=IhrSicheresRootPasswort456!

# JWT Secret (32+ Zeichen)
JWT_SECRET=IhrSehrLangerJWTSecretMitMindestens32Zeichen

# Admin E-Mails
ADMIN_EMAIL_1=ihr-admin@email.com
ADMIN_EMAIL_2=zweiter-admin@email.com

# Email (optional - leer lassen wenn nicht gewünscht)
EMAIL_SERVICE=gmail
EMAIL_USER=ihr-gmail@gmail.com
EMAIL_PASS=ihr-app-passwort
```

## 🐳 4. Deployment ausführen

### Automatisches Deployment
```bash
chmod +x scripts/deploy-pi.sh
./scripts/deploy-pi.sh
```

**Das Skript macht folgendes:**
1. ✅ Installiert Docker & Docker Compose
2. ✅ Erstellt notwendige Verzeichnisse
3. ✅ Baut die Container für ARM-Architektur
4. ✅ Startet alle Services (App, MySQL, Nginx)
5. ✅ Führt Gesundheitschecks durch

### Manuelles Deployment (falls automatisch fehlschlägt)

#### Docker installieren
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
sudo reboot
```

#### Container starten
```bash
docker-compose build --no-cache
docker-compose up -d
```

## ✅ 5. Installation überprüfen

### Services kontrollieren
```bash
docker-compose ps
```

**Erwartete Ausgabe:**
```
         Name                       Command               State           Ports         
-------------------------------------------------------------------------------------
time-account-app      dumb-init -- node dist/ser ...   Up      3000/tcp             
time-account-mysql    docker-entrypoint.sh mysqld      Up      0.0.0.0:3306->3306/tcp
time-account-nginx    /docker-entrypoint.sh ngin ...   Up      0.0.0.0:443->443/tcp, 
                                                               0.0.0.0:80->80/tcp
```

### Logs überprüfen
```bash
# App-Logs anzeigen
docker-compose logs app

# MySQL-Logs anzeigen
docker-compose logs mysql

# Alle Logs anzeigen
docker-compose logs -f
```

### Gesundheitscheck
```bash
curl http://localhost/health
# Erwartung: {"status": "healthy", "timestamp": "..."}
```

## 🌐 6. Zugriff testen

### Lokal (auf dem Pi)
```bash
curl http://localhost
```

### Im Netzwerk
- Öffnen Sie `http://[PI-IP-ADRESSE]` in Ihrem Browser
- Beispiel: `http://192.168.1.100`

## 🔒 7. SSL/HTTPS einrichten (optional)

### Voraussetzungen
- Domain-Name (z.B. meinedomain.com)
- Port-Forwarding 80 & 443 im Router

### SSL aktivieren
```bash
# Domain in .env setzen
nano .env  # DOMAIN_NAME=meinedomain.com

# SSL-Setup ausführen
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh
```

## 📊 8. Admin-User erstellen

```bash
# Interaktiv
node scripts/create-admin.js

# Oder mit Umgebungsvariablen
DB_USER=timeaccount DB_PASSWORD=IhrDBPasswort node scripts/create-admin.js
```

## 🛠️ 9. Wartung

### Container neustarten
```bash
docker-compose restart
```

### Updates einspielen
```bash
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Backup erstellen
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

### Logs rotieren
```bash
docker-compose logs --tail=100 > logs/app-$(date +%Y%m%d).log
```

## 🚨 10. Troubleshooting

### Pi zu langsam?
```bash
# Memory-Optimierung für Pi 3B
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10

# Swap-Datei vergrößern
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Container startet nicht?
```bash
# Detaillierte Logs
docker-compose logs --tail=50 app

# Container neu bauen
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Speicherplatz prüfen
```bash
df -h
docker system df
```

## 📋 11. Port-Konfiguration für externen Zugriff

### Router-Einstellungen
- **Port 80 (HTTP)** → Pi IP:80
- **Port 443 (HTTPS)** → Pi IP:443

### Firewall (falls aktiviert)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

## 🎯 12. Performance-Optimierung für Pi 3B

### Docker-Optimierungen
```bash
# In docker-compose.yml deploy-Limits setzen:
# deploy:
#   resources:
#     limits:
#       memory: 512M
#     reservations:
#       memory: 256M
```

### Systemoptimierungen
```bash
# GPU-Memory reduzieren (da Headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# CPU-Governor auf Performance
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

## ✅ 13. Erfolg!

Nach erfolgreichem Deployment ist PayPay erreichbar unter:

- **Lokal:** http://localhost
- **Netzwerk:** http://[PI-IP]
- **Internet:** http://[IHRE-DOMAIN] (mit SSL: https://)

### Standard-Login
- Benutzername: `admin`
- Passwort: Wie bei Admin-Erstellung festgelegt

**🎉 Viel Spaß mit PayPay auf Ihrem Raspberry Pi!**