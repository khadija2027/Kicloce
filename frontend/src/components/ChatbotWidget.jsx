import { useState, useRef, useEffect } from 'react';
import { colors } from '../theme';

// ─── Messages initiaux ───────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 1, me: false,
    text: "Bonjour ! 👋 Je suis **Tontine IA**, votre assistant financier personnel.\n\nJe peux vous aider avec :\n• Vos tontines et versements\n• La gestion de votre épargne\n• Vos objectifs financiers\n• Des conseils sur la finance",
    time: '09:00',
  },
];

// Réponses automatiques selon mots-clés
const AUTO_REPLIES = [
  {
    keys: ['tontine','versement','groupe'],
    reply: "Pour vos tontines actives, votre prochain versement est de **1 500 MAD** prévu **vendredi**. Souhaitez-vous que je vous envoie un rappel ? 📅",
  },
  {
    keys: ['solde','wallet','argent','compte'],
    reply: "Votre solde wallet actuel est de **3 250 MAD** 💰\n\nVous pouvez :\n• Déposer des fonds\n• Retirer vers votre compte bancaire\n• Transférer à un membre",
  },
  {
    keys: ['objectif','épargne','épargner','but'],
    reply: "Vos objectifs en cours 🎯\n\n• Achat Voiture : 65% (52K/80K MAD)\n• Voyage famille : 74% (18.5K/25K MAD)\n• Formation pro : 27%\n\nVotre taux de réalisation global est de **73%** — excellent rythme !",
  },
  {
    keys: ['score','note','évaluation','réputation'],
    reply: "Votre score Tontine+ est de **780 / 1 000** ⭐\n\nCatégorie : **Très bon**\n\nPour améliorer votre score :\n• Payer vos versements à temps\n• Rejoindre plus de groupes actifs\n• Compléter votre profil",
  },
  {
    keys: ['conseil','aide','comment','astuce'],
    reply: "Voici mes 3 conseils du jour 💡\n\n1. **Automatisez** vos versements pour ne jamais rater une échéance\n2. **Diversifiez** en rejoignant des tontines de montants différents\n3. **Épargnez** au moins 20% du pot reçu à chaque tour",
  },
  {
    keys: ['bonjour','salut','bonsoir','hello','hi'],
    reply: "Bonjour ! 😊 Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez me poser des questions sur vos tontines, votre épargne, vos objectifs ou demander des conseils financiers.",
  },
  {
    keys: ['merci','super','parfait','génial','top'],
    reply: "Avec plaisir ! 🙏 N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider à atteindre vos objectifs financiers ! 💪",
  },
];

const DEFAULT_REPLY = "Je comprends votre question. Laissez-moi analyser votre situation...\n\nPour des conseils personnalisés, je vous recommande de consulter la section **Formation** ou de contacter votre groupe via **Messages**. Puis-je vous aider avec autre chose ? 😊";

function getAutoReply(text) {
  const lower = text.toLowerCase();
  for (const { keys, reply } of AUTO_REPLIES) {
    if (keys.some((k) => lower.includes(k))) return reply;
  }
  return DEFAULT_REPLY;
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

  function send() {
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

    setTimeout(() => {
      const reply = getAutoReply(text);
      setTyping(false);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, me: false,
        text: reply,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1200 + Math.random() * 600);
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
