# 🤖 Dépannage du Chatbot Tontine IA

## 🔴 Problème: Le chatbot retourne des réponses génériques

Si le chatbot affiche en boucle :
```
"Je comprends votre question. Laissez-moi analyser votre situation..."
```

**C'est normal!** Cela signifie que l'API Groq n'est pas configurée.

---

## ✅ Solution: Configurer l'API Groq localement

### 1️⃣ Obtenez votre clé API

1. Allez à: https://console.groq.com
2. Connectez-vous ou créez un compte
3. Cliquez sur **API Keys** dans le menu
4. Créez une nouvelle clé API
5. Copiez la clé (elle commence par `gsk_`)

### 2️⃣ Créez le fichier `.env.local`

**Chemin**: `frontend/.env.local`

```env
VITE_GROQ_API_KEY=gsk_votre_clé_api_ici
```

**Remplacez** `gsk_votre_clé_api_ici` par votre vraie clé.

### 3️⃣ Redémarrez le serveur de développement

```bash
cd frontend
npm run dev
```

### 4️⃣ Testez le chatbot

1. Ouvrez l'app à http://localhost:5173
2. Cliquez sur le bouton chat (🤖 en bas à droite)
3. Posez une question comme:
   - "Comment fonctionne une tontine?"
   - "Quel est le maximum que je peux transférer?"
   - "Donne-moi des conseils pour épargner"

**Vous devriez maintenant voir des réponses intelligentes de Groq!** ✨

---

## 🐳 Pour Hugging Face Spaces

1. Allez à https://huggingface.co/spaces/Khdidij/Kicloce
2. Cliquez **Settings** (haut droit)
3. Allez à **Variables and secrets**
4. Cliquez **+ New secret**
5. Entrez:
   - **Name**: `VITE_GROQ_API_KEY`
   - **Value**: `gsk_[your-api-key-here]` (obtenir de https://console.groq.com/keys)
6. Cliquez **Add secret**
7. **Attendez le redéploiement** (2-3 minutes)

---

## 🐛 Débogage

### Vérifier si la clé est chargée

Ouvrez la console du navigateur (F12) et vérifiez si vous voyez:

**✅ Bon**:
```
[Chatbot] Calling Groq API...
[Chatbot] ✅ Got API response
```

**❌ Mauvais** (clé non configurée):
```
[Chatbot] ⚠️ Groq API Key not configured
[Chatbot] Using fallback response (Groq API not configured)
```

### Vérifier votre clé API

- La clé doit **commencer par `gsk_`**
- Vérifiez qu'il n'y a pas d'espaces supplémentaires
- Vérifiez que le fichier `.env.local` **n'a pas** de guillemets:
  - ✅ `VITE_GROQ_API_KEY=gsk_xxxxxxx`
  - ❌ `VITE_GROQ_API_KEY="gsk_xxxxxxx"`

---

## ⚡ Mode Fallback (pas besoin de clé API)

Même **sans** clé API, le chatbot fonctionne avec des réponses intelligentes prédéfinies! 

Le chatbot reconnaît les mots-clés et répond:
- "wallet" → Info de solde
- "tontine" → Info versements
- "objectif" → Info épargne
- "score" → Info réputation
- Et plus...

---

## 📊 Limites Groq

- **Gratuit**: 5000 appels/jour
- **Vitesse**: Réponse généralement < 2 secondes
- **Modèle**: Mixtral 8x7b (excellent qualité/prix)

---

## 🆘 Besoin d'aide?

1. Consultez [CHATBOT_CONFIG.md](./CHATBOT_CONFIG.md) pour plus de détails
2. Vérifiez les logs du navigateur (Console F12)
3. Vérifiez que `.env.local` existe dans le dossier `frontend/`

**Dernière mise à jour**: 19 avril 2026
