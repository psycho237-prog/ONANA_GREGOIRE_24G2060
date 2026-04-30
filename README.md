# Student Pulse - Plateforme d'Analyse des Sentiments Étudiants

Une plateforme moderne et performante pour collecter et analyser les feedbacks des étudiants sur les cours et la vie de campus en temps réel.

## 🚀 Fonctionnalités
- **Dashboard Premium** : Interface réactive avec graphiques interactifs (Recharts).
- **Analyse de Sentiment** : Traitement automatique des feedbacks par IA (Python/TextBlob).
- **Identification des Étudiants** : Initialisé avec les données réelles de la Faculté des Sciences 2025/2026.
- **Backend Hybride** : Performance du Rust (Axum) combinée à la puissance de Python pour l'IA.
- **Mode Sombre** : Design élégant et moderne pour une expérience utilisateur premium.
- **Auto-Ping** : Système intégré pour maintenir le service actif sur Render (Free tier).

## 🛠 Architecture
- **Frontend** : Next.js 14+, TailwindCSS, Lucide Icons, Recharts.
- **Backend Principal** : Rust (Axum, SQLite).
- **Service IA** : Python (Sentiment Analysis).
- **Déploiement** : Docker, Render Blueprint.

## 💻 Installation Locale

### Pré-requis
- Rust (cargo)
- Python 3.11+
- Node.js & npm

### Étapes
1. **Initialiser les données** :
   ```bash
   # Extraire les étudiants du PDF (déjà fait si students.json existe)
   python3 scripts/extract_students.py
   ```

2. **Lancer le Backend** :
   ```bash
   cd backend-rust
   cargo run
   ```
   *Note : Le serveur écoute sur http://localhost:8080. Il initialisera la base SQLite avec 4500+ étudiants et 50 feedbacks aléatoires.*

3. **Lancer le Frontend (Mode Dev)** :
   ```bash
   cd frontend-new
   npm install
   npm run dev
   ```
   *Note : L'interface sera disponible sur http://localhost:3000.*

## 🚢 Déploiement sur Render
1. Poussez ce projet sur GitHub.
2. Connectez le dépôt à Render via **Blueprint**.
3. Configurez la variable `PUBLIC_URL` avec l'URL finale pour l'auto-ping.

## 📄 Licence
Projet réalisé dans le cadre académique pour la Faculté des Sciences, 2025/2026.
