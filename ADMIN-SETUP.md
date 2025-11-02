# Admin-Benutzer Management

## Admin-Benutzer erstellen

Nach der ersten Installation der App sind keine Standard-Benutzer vorhanden. Um einen Admin-Benutzer zu erstellen, verwenden Sie das bereitgestellte Script:

### Schritt 1: Script ausführen
```bash
node scripts/create-admin.js
```

### Schritt 2: Daten eingeben
Das Script wird Sie nach folgenden Informationen fragen:
- **Benutzername** (Standard: admin)
- **E-Mail-Adresse** (erforderlich für Benachrichtigungen)
- **Passwort** (mindestens 6 Zeichen, wird verborgen eingegeben)

### Beispiel-Ausführung:
```
🔧 Admin-Benutzer erstellen für Time Account Management

Benutzername für Admin (Standard: admin): mein-admin
E-Mail-Adresse für Admin: admin@beispiel.de
Passwort für Admin (wird nicht angezeigt): ******

🔗 Verbinde zur Datenbank...
🔐 Hashe das Passwort...
👨‍💼 Erstelle Admin-User...

✅ Admin-User erfolgreich erstellt!
👤 Username: mein-admin
📧 E-Mail: admin@beispiel.de
🔑 Passwort: [verborgen]

🚀 Sie können sich jetzt mit diesen Daten anmelden.
🌐 App-URL: http://localhost:3000
```

## Mehrere Admins erstellen

Sie können das Script mehrmals ausführen, um weitere Admin-Benutzer zu erstellen. Verwenden Sie einfach unterschiedliche Benutzernamen.

## Wichtige Hinweise

- **Sichere Passwörter verwenden**: Wählen Sie starke Passwörter für Admin-Accounts
- **E-Mail-Adresse**: Wird für Benachrichtigungen über neue Registrierungen verwendet
- **Bestehende Admins**: Das Script aktualisiert bestehende Benutzer, wenn der Username bereits existiert

## Troubleshooting

**Fehler "Database connection failed":**
- Stellen Sie sicher, dass die MySQL-Datenbank läuft
- Überprüfen Sie die Datenbankverbindungsparameter in der Konfiguration

**Fehler "Email validation":**
- Geben Sie eine gültige E-Mail-Adresse mit @ ein

**Fehler "Password too short":**
- Verwenden Sie mindestens 6 Zeichen für das Passwort