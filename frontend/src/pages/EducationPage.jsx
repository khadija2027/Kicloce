import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import TopBar         from '../components/TopBar';
import BottomNav      from '../components/BottomNav';
import ChatbotWidget  from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données ────────────────────────────────────────────────────────────────
const STATS = [
  { value: '12',  label: 'Articles lus'  },
  { value: '68%', label: 'Progression'   },
  { value: '3',   label: 'Badges'        },
];

const RESOURCES = [
  {
    color: 'blue', icon: '📖', cat: 'Fondamentaux',
    title: 'Comprendre la Tontine',
    desc:  'Histoire, fonctionnement et avantages de la tontine.',
    time:  '8 min', level: 'deb',
  },
  {
    color: 'green', icon: '💰', cat: 'Gestion',
    title: 'Budget & Épargne Intelligente',
    desc:  'Méthodes pratiques pour optimiser ses finances.',
    time:  '12 min', level: 'deb',
  },
  {
    color: 'orange', icon: '📊', cat: 'Investissement',
    title: 'Faire fructifier son pot',
    desc:  "Stratégies pour investir l'argent de votre tour.",
    time:  '15 min', level: 'int',
  },
  {
    color: 'blue', icon: '👥', cat: 'Communauté',
    title: 'Gérer un groupe de tontine',
    desc:  'Leadership et bonnes pratiques pour admins.',
    time:  '10 min', level: 'int',
  },
  {
    color: 'green', icon: '🏦', cat: 'Finance',
    title: 'Produits financiers Maroc',
    desc:  'Placements, assurances et services bancaires.',
    time:  '20 min', level: 'adv',
  },
  {
    color: 'orange', icon: '⚖️', cat: 'Légal',
    title: 'Cadre juridique tontine',
    desc:  'Aspects légaux et protection des participants.',
    time:  '18 min', level: 'adv',
  },
];

const ICON_BG = {
  blue:   colors.primaryBg,
  green:  colors.successBg,
  orange: '#FFFBEB',
};

const LEVEL_STYLE = {
  deb: { bg: colors.successBg,  text: colors.successDark, label: 'Débutant'      },
  int: { bg: '#FFFBEB',         text: '#92400E',           label: 'Intermédiaire' },
  adv: { bg: colors.dangerBg,   text: colors.dangerDark,   label: 'Avancé'        },
};

// ─── Sous-composants ────────────────────────────────────────────────────────
function EduHero() {
  const s = {
    hero:  { background: colors.primary, padding: 12, color: colors.white, flexShrink: 0 },
    title: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
    sub:   { fontSize: 8,  color: 'rgba(255,255,255,.7)' },
    stats: { display: 'flex', gap: 6, marginTop: 8 },
    stat:  { background: 'rgba(255,255,255,.12)', borderRadius: 7, padding: '6px 8px', textAlign: 'center', flex: 1 },
    val:   { fontSize: 12, fontWeight: 700, color: colors.white },
    lbl:   { fontSize: 7,  color: 'rgba(255,255,255,.65)' },
  };
  return (
    <div style={s.hero}>
      <div style={s.title}>Éducation financière</div>
      <div style={s.sub}>Développez vos connaissances en finance</div>
      <div style={s.stats}>
        {STATS.map(({ value, label }) => (
          <div key={label} style={s.stat}>
            <div style={s.val}>{value}</div>
            <div style={s.lbl}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceCard({ item }) {
  const lvl = LEVEL_STYLE[item.level];
  const s = {
    card: {
      display: 'flex', alignItems: 'center',
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 8,
      margin: '0 8px 5px',
      overflow: 'hidden',
      cursor: 'pointer',
    },
    icon: {
      width: 44, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      alignSelf: 'stretch',
      background: ICON_BG[item.color],
      fontSize: 18, padding: 10,
    },
    body: { flex: 1, padding: 8 },
    cat:  { fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.gray400, fontWeight: 600, marginBottom: 1 },
    title:{ fontSize: 10, fontWeight: 600, color: colors.dark, marginBottom: 1 },
    desc: {
      fontSize: 8, color: colors.gray600, lineHeight: 1.35,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    footer:{ display: 'flex', gap: 5, marginTop: 3, alignItems: 'center' },
    time:  { fontSize: 7, color: colors.gray400 },
    badge: { fontSize: 7, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: lvl.bg, color: lvl.text },
  };

  return (
    <div style={s.card}>
      <div style={s.icon}>{item.icon}</div>
      <div style={s.body}>
        <div style={s.cat}>{item.cat}</div>
        <div style={s.title}>{item.title}</div>
        <div style={s.desc}>{item.desc}</div>
        <div style={s.footer}>
          <span style={s.time}>⏱ {item.time}</span>
          <span style={s.badge}>{lvl.label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
/**
 * EducationPage — éducation financière et ressources.
 */
export default function EducationPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);

  const getAvatarInitials = (user) => {
    if (!user) return 'FA';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
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
    secTtl: { padding: '6px 8px 2px', fontSize: 11, fontWeight: 700, color: colors.dark },
  };

  return (
    <div style={s.screen}>
      <TopBar showNotif avatar={getAvatarInitials(authUser)} />

      <div style={s.scroll}>
        <EduHero />
        <div style={s.secTtl}>Ressources recommandées</div>
        {RESOURCES.map((r) => <ResourceCard key={r.title} item={r} />)}
        <div style={{ height: 10 }}/>
      </div>

      <ChatbotWidget />
      <BottomNav activePage="formation" onNavigate={handleNavigate} />
    </div>
  );
}
