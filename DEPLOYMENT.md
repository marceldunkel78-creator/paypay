# Time Account Management App - Deployment Guide

## Deployment mit Railway

### 1. Vorbereitung
- GitHub Repository erstellen und Code hochladen
- Railway Account erstellen (https://railway.app)

### 2. Railway Setup

1. **Neues Projekt erstellen:**
   - Bei Railway einloggen
   - "New Project" klicken
   - "Deploy from GitHub repo" auswählen
   - Ihr Repository auswählen

2. **MySQL Datenbank hinzufügen:**
   - Im Projekt-Dashboard "New Service" klicken
   - "Database" -> "MySQL" auswählen
   - Railway erstellt automatisch Umgebungsvariablen

3. **Umgebungsvariablen konfigurieren:**
   - Im Service-Dashboard "Variables" Tab öffnen
   - Folgende Variablen hinzufügen:

```
NODE_ENV=production
JWT_SECRET=ihr_sehr_sicherer_jwt_secret
JWT_EXPIRES_IN=24h
ADMIN_PASSWORD=ihr_admin_passwort
EMAIL_SERVICE=gmail
EMAIL_USER=ihre_email@gmail.com
EMAIL_PASS=ihr_app_passwort
ADMIN_EMAIL_1=admin1@example.com
ADMIN_EMAIL_2=admin2@example.com
```

4. **Build & Deploy:**
   - Railway erkennt automatisch Node.js
   - Deployment startet automatisch
   - URL wird bereitgestellt

### 3. Nach dem Deployment

1. **Datenbank initialisieren:**
   - Railway Console öffnen
   - Migrations ausführen oder Admin-User erstellen

2. **Domain konfigurieren (optional):**
   - Custom Domain in Railway Settings

### 4. Kosten
- **Hobby Plan:** $5/Monat (ausreichend für kleine Apps)
- **Free Tier:** Begrenzte Ressourcen, gut zum Testen

### Alternative Provider:

#### Render
- Ähnlich zu Railway
- Guter kostenloser Tier
- PostgreSQL statt MySQL

#### DigitalOcean App Platform
- Mehr Kontrolle
- Höhere Kosten
- Managed Databases

## Lokale Entwicklung

```bash
npm install
npm run build
npm run start:prod
```