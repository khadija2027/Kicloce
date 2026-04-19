import { useState, useRef, useEffect } from 'react';
import { colors } from '../theme';

// ─── API Configuration ───────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'sk-placeholder';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Vérifier si la clé API est disponible et valide
const GROQ_AVAILABLE = GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_');

// Log au chargement du module
if (!GROQ_AVAILABLE && typeof window !== 'undefined') {
  console.warn('[Chatbot] ⚠️ Groq API Key not configured');
  console.warn('[Chatbot] To enable AI responses: Set VITE_GROQ_API_KEY=gsk_... in .env.local');
}

const SYSTEM_PROMPT = `Tu es Tontine IA, un assistant financier expert en tontines et finances. Tu as pour mission d'aider les utilisateurs marocains à:
- Comprendre le système des tontines (épargne collective, versements réguliers, etc.)
- Gérer leurs wallets et transactions
- Atteindre leurs objectifs financiers
- Optimiser leurs finances personnelles
- Suivre leurs tontines et versements

Ton ton est amical, encourageant et pédagogue. Tu donnes des conseils pratiques et adaptés au contexte marocain (montants en MAD, horaires locaux, pratiques communautaires).

Informations sur l'utilisateur:
- Plateforme: Tontine Digitale (application Web)
- Fonctionnalités disponibles: Wallet, Tontines, Objectifs, Messages, Formation
- Devise: MAD (Dirham marocain)

Tu répondis toujours en français et tu fournis des réponses concises mais utiles (max 150 mots).`;

// ─── Messages initiaux ───────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 1, me: false,
    text: "Bonjour ! 👋 Je suis **Tontine IA**, votre assistant financier personnel.\n\nJe peux vous aider avec :\n• Vos tontines et versements\n• La gestion de votre épargne\n• Vos objectifs financiers\n• Des conseils sur la finance",
    time: '09:00',
  },
];

// ─── Fallback Responses (quand l'API n'est pas disponible) ──────────────────
const AUTO_REPLIES = [
  {
    keys: ['tontine','versement','groupe','adheren','rejoind','créer'],
    reply: "Pour vos tontines actives, votre prochain versement est de **1 500 MAD** prévu **vendredi**. Souhaitez-vous que je vous envoie un rappel ? 📅",
  },
  {
    keys: ['solde','wallet','argent','compte','balance','retrait'],
    reply: "Votre solde wallet actuel est de **15 750 MAD** 💰\n\nVous pouvez :\n• Déposer des fonds (↑ Déposer)\n• Retirer vers votre compte bancaire (↓ Retirer)\n• Transférer à un membre (⇄ Transférer)",
  },
  {
    keys: ['objectif','épargne','épargner','but','savings','goal','acheter'],
    reply: "Vos objectifs en cours 🎯\n\n• Achat Voiture : 65% (52K/80K MAD)\n• Voyage famille : 74% (18.5K/25K MAD)\n• Formation pro : 27%\n\nVotre taux de réalisation global est de **73%** — excellent rythme !",
  },
  {
    keys: ['score','note','évaluation','réputation','rating'],
    reply: "Votre score Tontine+ est de **780 / 1 000** ⭐\n\nCatégorie : **Très bon**\n\nPour améliorer votre score :\n• Payer vos versements à temps\n• Rejoindre plus de groupes actifs\n• Compléter votre profil",
  },
  {
    keys: ['conseil','aide','comment','astuce','fee','frais','charges'],
    reply: "Voici mes 3 conseils du jour 💡\n\n1. **Automatisez** vos versements pour ne jamais rater une échéance\n2. **Diversifiez** en rejoignant des tontines de montants différents\n3. **Épargnez** au moins 20% du pot reçu à chaque tour",
  },
  {
    keys: ['bonjour','salut','bonsoir','hello','hi','ça va','comment'],
    reply: "Bonjour ! 😊 Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez me poser des questions sur vos tontines, votre épargne, vos objectifs ou demander des conseils financiers.",
  },
  {
    keys: ['merci','super','parfait','génial','top','thanks','cool'],
    reply: "Avec plaisir ! 🙏 N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider à atteindre vos objectifs financiers ! 💪",
  },
  {
    keys: ['transfert','envoyer','payer','virement','send','money'],
    reply: "Pour transférer de l'argent à un membre : 📤\n\n1. Cliquez sur **⇄ Transférer** dans votre wallet\n2. Entrez le numéro téléphone du destinataire\n3. Saisissez le montant\n4. Confirmez avec l'OTP\n\nLes frais de transfert sont de **2.5%**.",
  },
];

const DEFAULT_REPLY = "C'est une bonne question ! 🤔\n\nPour vous fournir le meilleur conseil, pourriez-vous préciser votre question ?\n\nPar exemple :\n• Comment fonctionne une tontine ?\n• Quel est mon solde wallet ?\n• Comment augmenter mon épargne ?";

function getFallbackReply(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const { keys, reply } of AUTO_REPLIES) {
    if (keys.some((k) => lower.includes(k))) {
      return reply;
    }
  }
  return DEFAULT_REPLY;
}

// ─── Groq API Call ───────────────────────────────────────────────────────────
async function callGroqAPI(userMessage, conversationHistory = []) {
  // Si l'API n'est pas disponible, utiliser les réponses prédéfinies
  if (!GROQ_AVAILABLE) {
    console.log('[Chatbot] Using fallback response (Groq API not configured)');
    return getFallbackReply(userMessage);
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    console.log('[Chatbot] Calling Groq API...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Chatbot] API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    console.log('[Chatbot] ✅ Got API response');
    return aiResponse || getFallbackReply(userMessage);
  } catch (error) {
    console.error('[Chatbot] Failed to call Groq API:', error.message);
    console.log('[Chatbot] Using fallback response');
    return getFallbackReply(userMessage);
  }
}

// Rendu simple du markdown basique (gras uniquement)
function RenderText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p.split('\n').map((line, j) => (
            <span key={j}>{line}{j < p.split('\n').length - 1 && <br/>}</span>
          ))
      )}
    </span>
  );
}

// ─── Chat Window ─────────────────────────────────────────────────────────────
function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(), me: true,
      text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      // Préparer l'historique de conversation
      const conversationHistory = messages
        .filter(m => m.id !== 1) // Exclure le premier message initial
        .map(m => ({
          role: m.me ? 'user' : 'assistant',
          content: m.text
        }));

      // Appeler l'API Groq
      const aiReply = await callGroqAPI(text, conversationHistory);
      
      setTyping(false);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, me: false,
        text: aiReply,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (error) {
      console.error('Error generating reply:', error);
      setTyping(false);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, me: false,
        text: "Désolé, je rencontre une connexion temporaire. Pourriez-vous réessayer ? 😊",
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  }

  const s = {
    window: {
      position: 'fixed',
      right: 10,
      bottom: 60,
      width: 320,
      height: 420,
      display: 'flex', flexDirection: 'column',
      background: '#ECE5DD', // WhatsApp-like warm bg
      zIndex: 100,
      borderRadius: '12px 12px 0 0',
      boxShadow: '0 5px 40px rgba(0,0,0,.16)',
      animation: 'slideUp .3s ease-out',
    },
    // ── Header ──
    header: {
      background: colors.primary,
      padding: '8px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
      flexShrink: 0,
    },
    closeBtn: {
      width: 24, height: 24, borderRadius: '50%',
      background: 'rgba(255,255,255,.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      fontSize: 10, color: colors.white,
    },
    botAv: {
      width: 30, height: 30, borderRadius: '50%',
      background: 'rgba(255,255,255,.2)',
      border: '2px solid rgba(255,255,255,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    botInfo: { flex: 1 },
    botName: { fontSize: 10, fontWeight: 700, color: colors.white },
    botStatus: {
      fontSize: 7, color: 'rgba(255,255,255,.75)',
      display: 'flex', alignItems: 'center', gap: 3,
    },
    statusDot: {
      width: 5, height: 5, borderRadius: '50%',
      background: '#4ADE80',
    },
    // ── Messages ──
    msgs: {
      flex: 1, overflowY: 'auto',
      padding: '8px 8px',
      display: 'flex', flexDirection: 'column', gap: 4,
    },
    // ── Date separator ──
    dateSep: {
      textAlign: 'center', fontSize: 6,
      color: '#667781',
      background: 'rgba(255,255,255,.7)',
      padding: '2px 8px', borderRadius: 8,
      alignSelf: 'center',
      marginBottom: 2,
    },
    // ── Bubble ──
    bubble: (me) => ({
      maxWidth: '82%',
      alignSelf: me ? 'flex-end' : 'flex-start',
      display: 'flex', flexDirection: 'column',
    }),
    bbl: (me) => ({
      background: me ? '#DCF8C6' : colors.white,
      borderRadius: me ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
      padding: '6px 8px',
      fontSize: 8.5, color: '#111B21', lineHeight: 1.45,
      boxShadow: '0 1px 2px rgba(0,0,0,.12)',
    }),
    bblFooter: (me) => ({
      display: 'flex', justifyContent: 'flex-end', gap: 3,
      marginTop: 2, paddingRight: 2,
    }),
    bblTime: { fontSize: 6, color: '#667781' },
    tick: { fontSize: 7, color: me => me ? colors.primary : '#667781' },
    // ── Typing ──
    typingBubble: {
      background: colors.white,
      borderRadius: '8px 8px 8px 2px',
      padding: '7px 10px',
      boxShadow: '0 1px 2px rgba(0,0,0,.12)',
      alignSelf: 'flex-start',
      display: 'flex', gap: 3, alignItems: 'center',
    },
    dot: (delay) => ({
      width: 5, height: 5, borderRadius: '50%',
      background: '#9CA3AF',
      animation: `bounce 1.2s ${delay}s infinite`,
    }),
    // ── Input ──
    inputBar: {
      display: 'flex', gap: 6, alignItems: 'center',
      padding: '6px 8px',
      background: '#F0F2F5',
      flexShrink: 0,
    },
    inputWrap: {
      flex: 1,
      background: colors.white,
      borderRadius: 20,
      display: 'flex', alignItems: 'center',
      padding: '5px 10px', gap: 5,
    },
    inp: {
      flex: 1, border: 'none', outline: 'none',
      fontSize: 8.5, color: colors.dark,
      background: 'transparent',
    },
    sendBtn: {
      width: 30, height: 30, borderRadius: '50%',
      background: colors.primary,
      border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    },
  };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-4px)}
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      <div style={s.window}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.closeBtn} onClick={onClose}>←</div>
          <div style={s.botAv}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"
                strokeLinecap="round"/>
            </svg>
          </div>
          <div style={s.botInfo}>
            <div style={s.botName}>Tontine IA</div>
            <div style={s.botStatus}>
              <div style={s.statusDot}/>
              <span>En ligne · Assistant financier</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={s.msgs} ref={scrollRef}>
          <div style={s.dateSep}>Aujourd'hui</div>

          {messages.map((m) => (
            <div key={m.id} style={s.bubble(m.me)}>
              <div style={s.bbl(m.me)}>
                <RenderText text={m.text}/>
              </div>
              <div style={s.bblFooter(m.me)}>
                <span style={s.bblTime}>{m.time}</span>
                {m.me && <span style={{ fontSize: 7, color: colors.primary }}>✓✓</span>}
              </div>
            </div>
          ))}

          {typing && (
            <div style={s.typingBubble}>
              <div style={s.dot(0)}/>
              <div style={s.dot(0.2)}/>
              <div style={s.dot(0.4)}/>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={s.inputBar}>
          <div style={s.inputWrap}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke={colors.gray400} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round"/>
              <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeWidth="3"/>
              <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeWidth="3"/>
            </svg>
            <input
              style={s.inp}
              placeholder="Écrivez un message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
          </div>
          <button style={s.sendBtn} onClick={send}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── FAB Button ──────────────────────────────────────────────────────────────
/**
 * ChatbotWidget — bouton flottant + fenêtre de chat IA style WhatsApp.
 * À placer directement dans l'écran (position: relative requis sur le parent).
 */
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  const s = {
    fab: {
      position: 'fixed',
      right: 10,
      bottom: 70, // au-dessus de la BottomNav
      width: 36, height: 36,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #0F3BA8 100%)`,
      boxShadow: '0 3px 12px rgba(26,86,219,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 50,
      border: `2px solid ${colors.white}`,
      transition: 'transform .15s',
    },
    pulse: {
      position: 'fixed',
      right: 10, bottom: 70,
      width: 36, height: 36,
      borderRadius: '50%',
      background: colors.primary,
      opacity: 0.3,
      zIndex: 49,
      animation: 'pulse 2s infinite',
    },
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%  { transform: scale(1);   opacity: .3 }
          50% { transform: scale(1.5); opacity: 0  }
          100%{ transform: scale(1);   opacity: .3 }
        }
      `}</style>

      {/* Chatbot window (overlay) */}
      {open && <ChatWindow onClose={() => setOpen(false)} />}

      {/* Pulse ring */}
      {!open && <div style={s.pulse}/>}

      {/* FAB */}
      {!open && (
        <div style={s.fab} onClick={() => setOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9"  cy="10" r="1" fill="white"/>
            <circle cx="12" cy="10" r="1" fill="white"/>
            <circle cx="15" cy="10" r="1" fill="white"/>
          </svg>
        </div>
      )}
    </>
  );
}
