# 🚀 GitHub Pages Deployment Guide

## Schritt-für-Schritt Anleitung

### 1. Repository auf GitHub erstellen

1. Gehe zu https://github.com/new
2. Repository Name: `scolia-dart-liga` (oder ein anderer Name)
3. Setze auf **Public** (GitHub Pages ist kostenlos für public repos)
4. **NICHT** "Initialize with README" aktivieren
5. Klicke auf **"Create repository"**

### 2. Vite Config anpassen

⚠️ **WICHTIG:** Ändere in `vite.config.js` den Repository-Namen:

```js
base: process.env.NODE_ENV === 'production' ? '/DEIN-REPO-NAME/' : '/'
```

Ersetze `scolia-dart-liga` mit deinem tatsächlichen Repository-Namen!

### 3. Code zu GitHub pushen

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/DEIN-REPO-NAME.git
git push -u origin main
```

### 4. Firebase Secrets in GitHub hinterlegen

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf **Settings** → **Secrets and variables** → **Actions**
3. Klicke auf **"New repository secret"**
4. Füge folgende Secrets hinzu (Werte aus deiner `.env` Datei):

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 5. GitHub Pages aktivieren

1. Gehe zu **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Speichern

### 6. Deployment starten

Der Workflow startet automatisch beim nächsten Push:

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push
```

### 7. Firebase Auth Domain hinzufügen

⚠️ **WICHTIG:** Damit Login funktioniert:

1. Gehe zur Firebase Console
2. **Authentication** → **Settings** → **Authorized domains**
3. Füge hinzu: `DEIN-USERNAME.github.io`
4. Klicke auf **"Add domain"**

### 8. Fertig! 🎉

Deine App ist jetzt verfügbar unter:

```
https://DEIN-USERNAME.github.io/DEIN-REPO-NAME/
```

## Troubleshooting

### Blank Page nach Deployment?
- Überprüfe `base` in `vite.config.js`
- Muss mit deinem Repository-Namen übereinstimmen

### Login funktioniert nicht?
- Füge die GitHub Pages Domain in Firebase Auth hinzu

### Build schlägt fehl?
- Überprüfe ob alle Secrets in GitHub hinterlegt sind
- Schaue in **Actions** Tab für Fehlerdetails

## Updates deployen

Einfach Code ändern und pushen:

```bash
git add .
git commit -m "Update"
git push
```

Der Workflow deployed automatisch!
