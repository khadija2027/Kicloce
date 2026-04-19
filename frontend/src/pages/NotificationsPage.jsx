import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import ChatbotWidget from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données statiques ──────────────────────────────────────────────────────
const NOTIFICATIONS = [
  {
    id: 1,
    type: 'prelevement',
    icon: '💳',
    title: 'Prélèvement prévu',
    desc: 'Versement Cercle Familial El Amrani',
    amount: '1 500 MAD',
    date: 'Vendredi 22 avril',
    status: 'upcoming',
    time: '08:00',
  },
  {
    id: 2,
    type: 'wallet',
    icon: '💰',
    title: 'Solde wallet faible',
    desc: 'Rechargez votre portefeuille pour continuer',
    amount: '---',
    balance: '250 MAD',
    status: 'alert',
    time: 'Aujourd\'hui',
  },
  {
    id: 3,
    type: 'payment',
    icon: '✓',
    title: 'Paiement effectué',
    desc: 'Versement reçu - Asso Jeunes Entrepreneurs',
    amount: '500 MAD',
    date: 'Jeudi 21 avril',
    status: 'completed',
    time: '14:32',
  },
  {
    id: 4,
    type: 'prelevement',
    icon: '💳',
    title: 'Prélèvement prévu',
    desc: 'Versement Club Épargne Femmes',
    amount: '2 000 MAD',
    date: 'Mercredi 27 avril',
    status: 'upcoming',
    time: '09:00',
  },
  {
    id: 5,
    type: 'achievement',
    icon: '🏆',
    title: 'Objectif atteint!',
    desc: 'Vous avez atteint votre objectif "Fonds d\'urgence"',
    amount: '15 000 MAD',
    date: 'Mardi 20 avril',
    status: 'success',
    time: '16:45',
  },
  {
    id: 6,
    type: 'reminder',
    icon: '🔔',
    title: 'Rappel de réunion',
    desc: 'Réunion du Cercle Familial El Amrani',
    amount: '---',
    date: 'Samedi 23 avril à 14h',
    status: 'info',
    time: '10:00',
  },
  {
    id: 7,
    type: 'joined',
    icon: '👋',
    title: 'Bienvenue au groupe!',
    desc: 'Vous avez rejoint "Tontine Voisinage Gueliz"',
    amount: '---',
    date: 'Lundi 19 avril',
    status: 'info',
    time: '11:20',
  },
];

const NOTIF_COLORS = {
  'upcoming':  { bg: '#EBF2FF', border: '#BFDBFE', icon: '#1A56DB', title: colors.dark, badge: '#BFDBFE' },
  'alert':     { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', title: colors.dark, badge: '#FCD34D' },
  'completed': { bg: '#ECFDF5', border: '#A7F3D0', icon: '#059669', title: colors.dark, badge: '#A7F3D0' },
  'success':   { bg: '#ECFDF5', border: '#A7F3D0', icon: '#059669', title: colors.dark, badge: '#A7F3D0' },
  'info':      { bg: '#F3F4F6', border: '#E5E7EB', icon: '#6B7280', title: colors.dark, badge: '#E5E7EB' },
};

// ─── Sous-composants ────────────────────────────────────────────────────────
function NotificationItem({ notif }) {
  const style = NOTIF_COLORS[notif.status];
  const s = {
    item: {
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 10, padding: 12,
      margin: '0 8px 8px',
      display: 'flex', gap: 10,
      cursor: 'pointer',
      transition: 'transform .2s, box-shadow .2s',
    },
    iconBox: {
      width: 44, height: 44, flexShrink: 0,
      borderRadius: '50%',
      background: style.badge,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20,
    },
    content: { flex: 1 },
    titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
    title: { fontSize: 10, fontWeight: 700, color: style.title },
    time: { fontSize: 7, color: colors.gray400 },
    desc: { fontSize: 8.5, color: colors.gray600, marginBottom: 4, lineHeight: 1.4 },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 10, fontWeight: 700, color: style.icon },
    date: { fontSize: 7, color: colors.gray500 },
  };

  return (
    <div style={s.item}>
      <div style={s.iconBox}>{notif.icon}</div>
      <div style={s.content}>
        <div style={s.titleRow}>
          <div style={s.title}>{notif.title}</div>
          <div style={s.time}>{notif.time}</div>
        </div>
        <div style={s.desc}>{notif.desc}</div>
        <div style={s.footer}>
          {notif.amount !== '---' && <div style={s.amount}>{notif.amount}</div>}
          {notif.balance && <div style={s.amount}>Solde: {notif.balance}</div>}
          <div style={s.date}>{notif.date}</div>
        </div>
      </div>
    </div>
  );
}

function NotificationFilter({ selectedFilter, onFilterChange }) {
  const s = {
    wrap: { padding: '8px 8px 6px' },
    pills: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 },
    pill: (active) => ({
      fontSize: 8, fontWeight: 600,
      padding: '5px 12px', borderRadius: 20,
      background: active ? colors.primary : colors.gray100,
      color: active ? colors.white : colors.gray600,
      border: 'none', cursor: 'pointer', flexShrink: 0,
      whiteSpace: 'nowrap',
      transition: 'all .2s',
    }),
  };

  const filters = [
    { label: 'Tous', value: 'all' },
    { label: 'Prélèvements', value: 'prelevement' },
    { label: 'Wallet', value: 'wallet' },
    { label: 'Paiements', value: 'payment' },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.pills}>
        {filters.map((f) => (
          <button
            key={f.value}
            style={s.pill(selectedFilter === f.value)}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyNotif() {
  const s = {
    wrap: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', textAlign: 'center',
    },
    icon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 11, fontWeight: 700, color: colors.dark, marginBottom: 4 },
    desc: { fontSize: 8.5, color: colors.gray600 },
  };
  return (
    <div style={s.wrap}>
      <div style={s.icon}>📭</div>
      <div style={s.title}>Aucune notification</div>
      <div style={s.desc}>Vous êtes à jour avec tous vos paramètres</div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
/**
 * NotificationsPage — notifications de prélèvements, rappels, paiements.
 */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  // Filtrer les notifications
  const filteredNotifications = selectedFilter === 'all'
    ? NOTIFICATIONS
    : NOTIFICATIONS.filter((n) => n.type === selectedFilter);

  const s = {
    screen: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
    scroll: { flex: 1, overflowY: 'auto' },
    header: { padding: '12px 8px', borderBottom: `1px solid ${colors.gray200}`, flexShrink: 0 },
    title: { fontSize: 11, fontWeight: 700, color: colors.dark },
  };

  return (
    <div style={s.screen}>
      <TopBar showNotif avatar="FA" />

      <div style={s.header}>
        <div style={s.title}>Notifications ({filteredNotifications.length})</div>
      </div>

      <div style={s.scroll}>
        <NotificationFilter selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => <NotificationItem key={notif.id} notif={notif} />)
        ) : (
          <EmptyNotif />
        )}
        <div style={{ height: 10 }}/>
      </div>

      <ChatbotWidget />
      <BottomNav activePage="accueil" onNavigate={handleNavigate} />
    </div>
  );
}
