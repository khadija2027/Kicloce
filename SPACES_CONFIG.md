# Configuration pour Hugging Face Spaces

Ce projet se déploie sur Hugging Face Spaces avec Docker.

## Variables d'environnement requises

Vous devez configurer les variables secrètes suivantes dans votre Space:

1. **VITE_GROQ_API_KEY** (Requis pour le chatbot IA)
   - Obtenez votre clé: https://console.groq.com
   - Valeur: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Type: Secret (ne sera jamais visible dans les logs)

## Étapes de configuration

1. Allez à votre Space Hugging Face: https://huggingface.co/spaces/Khdidij/Kicloce

2. Cliquez sur **Settings** (en haut à droite)

3. Allez à **Variables and secrets** (onglet dans Settings)

4. Cliquez sur **+ New secret**

5. Remplissez:
   - **Name**: `VITE_GROQ_API_KEY`
   - **Value**: Votre clé API Groq (commence par `gsk_`)

6. Cliquez **Add secret**

7. Attendez que le Space se redéploie automatiquement

## Vérification

Une fois redéployé:
- Ouvrez l'application Tontine
- Cliquez sur le bouton chat flottant (coin bas droit)
- Testez le chatbot en posant une question

## Support

Pour plus de détails, consultez [CHATBOT_CONFIG.md](../CHATBOT_CONFIG.md)
