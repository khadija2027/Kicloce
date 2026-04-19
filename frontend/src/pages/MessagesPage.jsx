import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import TopBar         from '../components/TopBar';
import BottomNav      from '../components/BottomNav';
import ChatbotWidget  from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données statiques ──────────────────────────────────────────────────────
const CONVERSATIONS = [
  {
    id: 'conv_1',
    name: 'Cercle Familial El Amrani',
    avatar: '👨‍👩‍👧‍👦',
    unread: 3,
    lastMessage: 'Ahmed: La réunion est prévue samedi à 14h...',
    time: '14:32',
    members: 8,
    type: 'group',
  },
  {
    id: 'conv_2',
    name: 'Asso Jeunes Entrepreneurs',
    avatar: '👔',
    unread: 0,
    lastMessage: 'Younes: C\'est une excellente opportunité pour...',
    time: '12:45',
    members: 12,
    type: 'group',
  },
  {
    id: 'conv_3',
    name: 'Club Épargne Femmes',
    avatar: '👩‍💼',
    unread: 1,
    lastMessage: 'Nadia: J\'ai finalisé les documents, à bientôt...',
    time: '11:20',
    members: 6,
    type: 'group',
  },
];

const SAMPLE_MESSAGES = {
  conv_1: [
    { id: 1, sender: 'Ahmed', text: 'Bonjour à tous! J\'espère que vous allez bien. Je voulais vous rappeler que notre tontine Cercle Familial El Amrani approche du cycle 6. N\'oubliez pas de préparer vos contributions.', time: '10:00', isOwn: false },
    { id: 2, sender: 'You', text: 'Salut Ahmed! Merci pour le rappel. Je confirme que je serai prêt pour le versement de 1500 MAD. C\'est excitant de voir notre épargne collective augmenter chaque mois!', time: '10:05', isOwn: true },
    { id: 3, sender: 'Fatima', text: 'Bonjour les amis! Comment allez-vous tous? Moi je suis très heureuse de la progression de notre tontine. Nous avons déjà dépassé nos objectifs initiaux!', time: '10:10', isOwn: false },
    { id: 4, sender: 'You', text: 'Ça va très bien! Oui Fatima, c\'est incroyable. Notre discipline collective a vraiment porté ses fruits. Continuons sur cette lancée pour atteindre nos rêves!', time: '10:15', isOwn: true },
    { id: 5, sender: 'Ahmed', text: 'Effectivement! Pour rappel, la réunion est prévue samedi à 14h chez moi. Nous allons discuter de la distribution et des nouveaux objectifs pour les 6 prochains mois. Dites-moi si vous avez des questions!', time: '14:32', isOwn: false },
  ],
  conv_2: [
    { id: 1, sender: 'Younes', text: 'Salut les gars! J\'ai une proposition intéressante. Et si on augmentait légèrement notre contribution pour accélérer nos objectifs? Avec 600 MAD par semaine au lieu de 500, nous atteindrons nos cibles plus rapidement.', time: '12:00', isOwn: false },
    { id: 2, sender: 'You', text: 'C\'est une bonne idée Younes! Dis-moi, tu penses que tout le monde peut supporter cette augmentation? Je suis d\'accord si c\'est pour une période limitée.', time: '12:05', isOwn: true },
    { id: 3, sender: 'Younes', text: 'C\'est une excellente opportunité pour nous! J\'ai calculé que si nous maintenons cette augmentation pendant 8 semaines, nous ferons un fonds d\'urgence supplémentaire. Qui est intéressé? Je suis très optimiste!', time: '12:45', isOwn: false },
  ],
  conv_3: [
    { id: 1, sender: 'Nadia', text: 'Chères amies, j\'espère que vous allez toutes bien! Je tenais à vous informer que notre Club Épargne Femmes a atteint un jalon important: 50 000 MAD collectés! C\'est grâce à votre engagement et votre discipline. Bravo à toutes!', time: '10:30', isOwn: false },
    { id: 2, sender: 'You', text: 'Nadia! C\'est magnifique! Nous devrions vraiment célébrer cet accomplissement. Cet argent va faire une énorme différence pour nos projets respectifs. Merci pour ta leadership!', time: '10:45', isOwn: true },
    { id: 3, sender: 'Nadia', text: 'Merci beaucoup pour tes encouragements! J\'ai terminé les documents officiels et les rapports mensuels. Vous pouvez les consulter sur notre plateforme partagée. À bientôt pour notre prochaine réunion le 25 avril. À très vite!', time: '11:20', isOwn: false },
  ],
};

// ─── ConversationItem ──────────────────────────────────────────────────────
function ConversationItem({ conv, onSelect, isActive }) {
  const s = {
    item: {
      background: isActive ? colors.primaryBg : colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 10,
      padding: 10,
      margin: '0 8px 6px',
      cursor: 'pointer',
      display: 'flex',
      gap: 8,
      position: 'relative',
      transition: 'all 0.2s',
    },
    avatar: {
      fontSize: 28,
      width: 44,
      height: 44,
      borderRadius: 8,
      background: colors.gray100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    content: { flex: 1, overflow: 'hidden' },
    top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    name: { fontSize: 11, fontWeight: 700, color: colors.dark },
    time: { fontSize: 8, color: colors.gray400 },
    msg: { fontSize: 9, color: colors.gray600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    badge: {
      position: 'absolute',
      top: 8, right: 8,
      width: 16, height: 16,
      borderRadius: '50%',
      background: colors.danger,
      color: colors.white,
      fontSize: 8,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <div style={s.item} onClick={onSelect}>
      <div style={s.avatar}>{conv.avatar}</div>
      <div style={s.content}>
        <div style={s.top}>
          <div style={s.name}>{conv.name}</div>
          <div style={s.time}>{conv.time}</div>
        </div>
        <div style={s.msg}>{conv.lastMessage}</div>
      </div>
      {conv.unread > 0 && <div style={s.badge}>{conv.unread}</div>}
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const s = {
    container: {
      display: 'flex',
      justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
      marginBottom: 8,
      paddingLeft: msg.isOwn ? 20 : 8,
      paddingRight: msg.isOwn ? 8 : 20,
      width: '100%',
    },
    bubble: {
      maxWidth: '70%',
      padding: '8px 12px',
      borderRadius: msg.isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
      background: msg.isOwn ? colors.primary : colors.white,
      color: msg.isOwn ? colors.white : colors.dark,
      fontSize: 10,
      lineHeight: 1.45,
      boxShadow: '0 1px 2px rgba(0,0,0,.08)',
    },
    sender: {
      fontSize: 8,
      color: colors.gray600,
      fontWeight: 600,
      marginBottom: 3,
      paddingLeft: msg.isOwn ? 0 : 2,
      paddingRight: msg.isOwn ? 2 : 0,
      textAlign: msg.isOwn ? 'right' : 'left',
    },
  };

  return (
    <div style={s.container}>
      <div style={{ width: '100%', display: 'flex', flexDirection: msg.isOwn ? 'column' : 'column', alignItems: msg.isOwn ? 'flex-end' : 'flex-start' }}>
        {!msg.isOwn && <div style={s.sender}>{msg.sender}</div>}
        <div style={s.bubble}>{msg.text}</div>
      </div>
    </div>
  );
}

// ─── ChatView ────────────────────────────────────────────────────────────
function ChatView({ conversation, messages, onBack, onSend, newMsg, setNewMsg }) {
  const s = {
    header: {
      background: colors.white,
      borderBottom: `1px solid ${colors.gray200}`,
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    backBtn: {
      background: 'none',
      border: 'none',
      fontSize: 16,
      cursor: 'pointer',
      color: colors.primary,
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 11, fontWeight: 700, color: colors.dark },
    headerSub: { fontSize: 8, color: colors.gray600 },
    scroll: { flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8, background: colors.gray50, display: 'flex', flexDirection: 'column' },
    input: {
      display: 'flex',
      gap: 6,
      padding: 10,
      borderTop: `1px solid ${colors.gray200}`,
      background: colors.white,
      flexShrink: 0,
    },
    textInput: {
      flex: 1,
      padding: '8px 12px',
      fontSize: 10,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 20,
      outline: 'none',
      background: colors.gray50,
    },
    sendBtn: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
    },
  };

  return (
    <>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <div style={s.headerInfo}>
          <div style={s.headerTitle}>{conversation.name}</div>
          <div style={s.headerSub}>{conversation.members} membres</div>
        </div>
        <div style={{ fontSize: 24 }}>{conversation.avatar}</div>
      </div>

      <div style={s.scroll}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.gray400, padding: 20 }}>
            Aucun message pour le moment
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
      </div>

      <div style={s.input}>
        <input
          style={s.textInput}
          type="text"
          placeholder="Écrire un message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
        />
        <button style={s.sendBtn} onClick={onSend}>↑</button>
      </div>
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  const getAvatarInitials = (user) => {
    if (!user) return 'FA';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const handleSelectConv = (conv) => {
    setSelectedConv(conv);
    setMessages(SAMPLE_MESSAGES[conv.id] || []);
  };

  const handleSendMessage = () => {
    if (newMsg.trim()) {
      const msg = {
        id: messages.length + 1,
        sender: 'You',
        text: newMsg,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      setMessages([...messages, msg]);
      setNewMsg('');
    }
  };

  const handleNavigate = (key) => {
    const routes = {
      'accueil': '/dashboard',
      'recherche': '/search',
      'objectifs': '/goals',
      'messages': '/messages',
      'formation': '/education',
    };
    navigate(routes[key] || '/dashboard');
  };

  const s = {
    screen: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
    scroll: { flex: 1, overflowY: 'auto' },
    header: { padding: '12px 8px', borderBottom: `1px solid ${colors.gray200}` },
    title: { fontSize: 11, fontWeight: 700, color: colors.dark },
  };

  if (selectedConv) {
    return (
      <div style={s.screen}>
        <TopBar showNotif avatar={getAvatarInitials(authUser)} />
        <ChatView
          conversation={selectedConv}
          messages={messages}
          onBack={() => setSelectedConv(null)}
          onSend={handleSendMessage}
          newMsg={newMsg}
          setNewMsg={setNewMsg}
        />
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <TopBar showNotif avatar={getAvatarInitials(authUser)} />
      
      <div style={s.header}>
        <div style={s.title}>Messages ({CONVERSATIONS.length})</div>
      </div>

      <div style={s.scroll}>
        {CONVERSATIONS.map(conv => (
          <ConversationItem
            key={conv.id}
            conv={conv}
            onSelect={() => handleSelectConv(conv)}
            isActive={selectedConv?.id === conv.id}
          />
        ))}
        <div style={{ height: 10 }} />
      </div>

      <ChatbotWidget />
      <BottomNav activePage="messages" onNavigate={handleNavigate} />
    </div>
  );
}
