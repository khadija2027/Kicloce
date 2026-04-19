/**
 * ROUTES: Messages & Conversations
 * ==================================
 */

const express = require('express');

const router = express.Router();

/**
 * GET /api/messages/conversations
 * Liste les groupes de tontines (conversations de groupe)
 */
router.get('/conversations', (req, res) => {
  try {
    // Décoder le token pour obtenir l'ID utilisateur
    const authHeader = req.headers.authorization;
    let user = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = JSON.parse(Buffer.from(token.replace('JWT_MOCK_', ''), 'base64').toString());
        user = global.database.users.find(u => u.id === decoded.id);
      } catch (e) {
        user = global.database.users.find(u => u.status === 'ACTIVE');
      }
    } else {
      user = global.database.users.find(u => u.status === 'ACTIVE');
    }

    if (!user) {
      return res.status(400).json({ error: 'No active user found' });
    }

    // Trouver les tontines de l'utilisateur
    const userTontines = global.database.tontines.filter(t => 
      t.participants.some(p => p.userId === user.id)
    );

    // Pour chaque tontine, créer une conversation de groupe
    const conversations = userTontines.map(tontine => {
      // Trouver le dernier message de cette tontine
      const tonMessages = global.database.messages.filter(m => m.tontineId === tontine.id);
      const lastMessage = tonMessages.length > 0 ? tonMessages[tonMessages.length - 1] : null;

      return {
        id: tontine.id,
        name: tontine.name,
        description: tontine.description,
        type: 'group',
        participants: tontine.participants,
        avatar: '👥',
        lastMessage: lastMessage ? lastMessage.text : 'Pas de messages yet',
        lastMessageTime: lastMessage ? lastMessage.timestamp : null,
        unread: 0,
        messagesCount: tonMessages.length
      };
    });

    return res.status(200).json({
      count: conversations.length,
      conversations: conversations
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/messages/conversations/:id
 * Récupère les messages d'une tontine (groupe)
 */
router.get('/conversations/:id', (req, res) => {
  try {
    const tontineId = req.params.id;
    // Récupérer les messages de cette tontine
    const messages = global.database.messages.filter(m => m.tontineId === tontineId);

    return res.status(200).json({
      count: messages.length,
      messages: messages.map(m => {
        const senderUser = global.database.users.find(u => u.id === m.senderId);
        return {
          id: m.id,
          senderId: m.senderId,
          senderName: senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : 'Unknown',
          text: m.text,
          timestamp: m.timestamp
        };
      })
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages/send
 * Envoie un message
 */
router.post('/send', (req, res) => {
  try {
    const user = global.database.users.find(u => u.status === 'ACTIVE');
    if (!user) {
      return res.status(400).json({ error: 'No active user found' });
    }

    const { conversationId, recipientId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = {
      id: `MSG_${Date.now()}`,
      conversationId,
      senderId: user.id,
      receiverId: recipientId,
      text,
      timestamp: new Date().toISOString()
    };

    global.database.messages.push(message);

    return res.status(201).json({
      id: message.id,
      message: 'Message sent successfully',
      message: message
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
