# 🎯 Scolia Dart Liga

Web-Anwendung für die Verwaltung einer Dart-Liga mit React und Firebase.

## Features

- ✅ Spieler-Registrierung und Login
- ✅ Liga-Tabelle mit Punkten und Legdifferenz
- ✅ Spieltage-Verwaltung (Best of 10 Legs)
- ✅ Ergebnis-Eingabe mit Bestätigungssystem
- ✅ Spieler-Statistiken (Shortlegs, 180er, High Finish, Best of 10)
- ✅ Admin-Panel für Spieltag- und Spiel-Erstellung
- ✅ Responsive Design für Mobile & Desktop

## Installation

### 1. Projekt klonen und Dependencies installieren

```bash
npm install
```

### 2. Firebase Projekt erstellen

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Erstelle ein neues Projekt
3. Aktiviere **Authentication** (E-Mail/Passwort)
4. Erstelle eine **Firestore Database** (im Test-Modus starten)
5. Gehe zu Projekteinstellungen und kopiere die Firebase Config

### 3. Umgebungsvariablen einrichten

Erstelle eine `.env` Datei im Root-Verzeichnis:

```bash
cp .env.example .env
```

Füge deine Firebase-Konfiguration ein:

```
VITE_FIREBASE_API_KEY=dein_api_key
VITE_FIREBASE_AUTH_DOMAIN=dein_projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dein_projekt_id
VITE_FIREBASE_STORAGE_BUCKET=dein_projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=deine_sender_id
VITE_FIREBASE_APP_ID=deine_app_id
```

### 4. Ersten Admin-User erstellen

1. Starte die App: `npm run dev`
2. Registriere dich als erster User
3. Gehe in die Firebase Console → Firestore Database
4. Finde deinen User in der `players` Collection
5. Setze das Feld `isAdmin` auf `true`

## Entwicklung

```bash
npm run dev
```

Öffne [http://localhost:5173](http://localhost:5173)

## Build für Produktion

```bash
npm run build
```

Die Build-Dateien befinden sich im `dist` Ordner.

## Deployment

### Option 1: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: GitHub Pages

1. Ändere in `vite.config.js` die `base` zu deinem Repository-Namen:
   ```js
   base: '/dein-repo-name/'
   ```

2. Build und Deploy:
   ```bash
   npm run build
   git add dist -f
   git commit -m "Deploy"
   git subtree push --prefix dist origin gh-pages
   ```

### Option 3: Vercel/Netlify

Einfach das Repository verbinden - automatisches Deployment!

## Firestore Struktur

### Collections:

**players**
- name, email, isAdmin
- stats: { shortlegs, oneEighties, highFinish, bestOfTen }

**matchdays**
- week, date

**matches**
- matchdayId, player1Id, player2Id
- player1Legs, player2Legs
- player1Submitted, player2Submitted, confirmed

## Nutzung

### Als Spieler:
1. Registrieren/Einloggen
2. Spieltage ansehen
3. Ergebnisse eintragen (beide Spieler müssen bestätigen)
4. Tabelle und Statistiken einsehen

### Als Admin:
1. Spieltage erstellen
2. Spiele/Paarungen zuweisen
3. Bei Bedarf Ergebnisse korrigieren (in Firestore Console)

## Lizenz

MIT
