# 🤖 Configuration du Chatbot Groq IA

## Aperçu

Le chatbot **Tontine IA** utilise l'API Groq pour fournir des réponses intelligentes basées sur l'IA. Le chatbot est configuré comme un assistant financier expert en tontines.

### Rôle du Chatbot

L'assistant aide les utilisateurs avec:
- ✅ Compréhension du système des tontines
- ✅ Gestion des wallets et transactions
- ✅ Objectifs financiers personnalisés
- ✅ Conseils en finance adaptés au contexte marocain
- ✅ Suivi des versements et groupes

---

## 🔧 Configuration

### 1. Obtenir une clé API Groq

1. Allez sur [console.groq.com](https://console.groq.com)
2. Créez un compte et connectez-vous
3. Générez une nouvelle clé API
4. La clé commence par `gsk_`

### 2. Configuration locale (développement)

Créez un fichier `frontend/.env.local`:

```env
VITE_GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Configuration en production (Hugging Face Spaces)

1. Allez à votre Space Hugging Face
2. Cliquez sur **Settings** → **Variables and secrets**
3. Ajoutez une nouvelle variable secrète:
   - **Name**: `VITE_GROQ_API_KEY`
   - **Value**: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 4. Configuration dans Docker

Modifiez le `Dockerfile` ou `docker-compose.yml`:

```yaml
environment:
  - VITE_GROQ_API_KEY=gsk_your_api_key_here
```

---

## 🚀 Utilisation

### Déploiement sur Hugging Face Spaces

1. Ajoutez la variable secrète dans les Spaces settings
2. Redéployez votre application
3. Le chatbot utilisera automatiquement la clé API

### Vérification du fonctionnement

1. Lancez l'application
2. Cliquez sur le bouton chat flottant (en bas à droite)
3. Posez une question sur les tontines ou finances
4. Le chatbot devrait répondre en quelques secondes

---

## 🔐 Sécurité

- **NE jamais** committer la clé API dans le code
- Utilisez les variables d'environnement (`.env.local`, secrets GitHub, etc.)
- `.env.local` est ignoré par Git (voir `.gitignore`)
- Les clés dans les commits seront automatiquement bloquées par GitHub

---

## 📊 Modèle IA

- **Fournisseur**: Groq (IA ultra-rapide)
- **Modèle**: `mixtral-8x7b-32768` (gratuit)
- **Temps de réponse**: < 2 secondes généralement
- **Langue**: Français (configuration du prompt système)

---

## 🎯 Améliorations futures

- [ ] Intégration avec les données réelles du wallet utilisateur
- [ ] Historique persistent des conversations
- [ ] Modération des réponses pour la compliance financière
- [ ] Support multilingue (Arabic, English, etc.)
- [ ] Intégration SMS pour recevoir l'OTP du chatbot

---

## ⚠️ Troubleshooting

### Le chatbot ne répond pas

**Cause**: Clé API manquante ou invalide

**Solution**:
```bash
# Vérifiez que .env.local existe et contient:
VITE_GROQ_API_KEY=gsk_...

# Redémarrez le serveur de développement:
npm run dev
```

### "API call failed" message

**Cause**: Clé API expirée ou limites d'utilisation atteintes

**Solution**:
- Vérifiez la clé API sur console.groq.com
- Vérifiez les limites d'utilisation (Groq offre gratuitement 5000 appels/jour)

### Code 401 ou 403

**Cause**: Authentification échouée

**Solution**:
- Vérifiez que la clé API commence par `gsk_`
- Régénérez une nouvelle clé sur console.groq.com

---

## 📚 Ressources

- [Documentation Groq API](https://console.groq.com/docs)
- [Modèles disponibles](https://console.groq.com/docs/models)
- [Guide de tarification](https://console.groq.com/pricing)

---

**Dernière mise à jour**: 19 avril 2026
