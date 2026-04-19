import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import ChatbotWidget from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données utilisateur ────────────────────────────────────────────────────
function getInitials(user) {
  if (!user) return 'FA';
  return (user.firstName?.charAt(0) + user.lastName?.charAt(0)).toUpperCase();
}

const SCORE_COLOR = (s) => {
  if (s >= 850) return { bar: '#059669', label: 'Excellent',   bg: '#ECFDF5', text: '#065F46' };
  if (s >= 700) return { bar: '#1A56DB', label: 'Très bon',    bg: '#EBF2FF', text: '#1143B0' };
  if (s >= 550) return { bar: '#D97706', label: 'Bon',         bg: '#FFFBEB', text: '#92400E' };
  return              { bar: '#EF4444', label: 'À améliorer', bg: '#FEF2F2', text: '#991B1B' };
};

const BADGES = [
  { icon: '🏆', label: 'Ponctuel',   desc: '12 versements à temps' },
  { icon: '🤝', label: 'Solidaire',  desc: '3 groupes rejoints'    },
  { icon: '⭐', label: 'Épargnant',  desc: '24 500 MAD épargnés'  },
];

const STATS = [
  { value: '8', label: 'Tontines\nrejoint' },
  { value: '4', label: 'Actif\naujourd\'hui' },
  { value: '24.5k', label: 'Total\népargnés' },
  { value: '95%', label: 'Taux\nponctualité' },
];

// ─── Sous-composants ────────────────────────────────────────────────────────
function ProfileHero({ user, onBack }) {
  const s = {
    wrap: {
      background: `linear-gradient(160deg, ${colors.primary} 0%, #0F3BA8 100%)`,
      padding: '10px 12px 14px',
      color: colors.white,
      flexShrink: 0,
      position: 'relative',
    },
    topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    back: {
      width: 26, height: 26, borderRadius: '50%',
      background: 'rgba(255,255,255,.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: 11, color: colors.white,
    },
    edit: {
      width: 26, height: 26, borderRadius: '50%',
      background: 'rgba(255,255,255,.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    },
    center: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    avRing: {
      width: 60, height: 60, borderRadius: '50%',
      border: '3px solid rgba(255,255,255,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 6,
    },
    av: {
      width: 52, height: 52, borderRadius: '50%',
      background: 'rgba(255,255,255,.25)',
      color: colors.white, fontSize: 18, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    name:  { fontSize: 14, fontWeight: 700, marginBottom: 2 },
    phone: { fontSize: 8,  color: 'rgba(255,255,255,.7)' },
    since: { fontSize: 7,  color: 'rgba(255,255,255,.55)', marginTop: 1 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.topRow}>
        <div style={s.back} onClick={onBack}>←</div>
        <div style={s.edit}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
              strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <div style={s.center}>
        <div style={s.avRing}>
          <div style={s.av}>{getInitials(user)}</div>
        </div>
        <div style={s.name}>{user?.firstName} {user?.lastName}</div>
        <div style={s.phone}>{user?.phoneNumber}</div>
        <div style={s.since}>Membre depuis {new Date(user?.createdAt || Date.now()).getFullYear()}</div>
      </div>
    </div>
  );
}

function ScoreCard({ user }) {
  const score = user?.score || 85;
  const pct = (score / 1000) * 100;
  const SC = SCORE_COLOR(score);
  
  const s = {
    card: {
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 10, padding: 10,
      margin: '8px 8px 0',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title:  { fontSize: 10, fontWeight: 700, color: colors.dark },
    badge:  {
      fontSize: 7, fontWeight: 700,
      padding: '2px 7px', borderRadius: 10,
      background: SC.bg, color: SC.text,
    },
    scoreRow: { display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 },
    scoreVal: { fontSize: 26, fontWeight: 800, color: SC.bar, lineHeight: 1 },
    scoreMax: { fontSize: 9,  color: colors.gray600, marginBottom: 4 },
    barWrap: { height: 6, background: colors.gray100, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3, background: SC.bar, width: `${pct}%`, transition: 'width .6s' },
    hint: { fontSize: 7, color: colors.gray400, marginTop: 4, textAlign: 'right' },
  };

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.title}>Score Tontine+</div>
        <div style={s.badge}>{SC.label}</div>
      </div>
      <div style={s.scoreRow}>
        <div style={s.scoreVal}>{score}</div>
        <div style={s.scoreMax}>/ 1 000</div>
      </div>
      <div style={s.barWrap}><div style={s.barFill}/></div>
      <div style={s.hint}>Basé sur ponctualité, participation & historique</div>
    </div>
  );
}

function StatsRow() {
  const s = {
    row:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, padding: '8px 8px 0' },
    cell: { background: colors.gray50, borderRadius: 8, padding: '6px 4px', textAlign: 'center' },
    val:  { fontSize: 11, fontWeight: 700, color: colors.dark },
    lbl:  { fontSize: 6, color: colors.gray600, marginTop: 1, whiteSpace: 'pre-line', lineHeight: 1.3 },
  };
  return (
    <div style={s.row}>
      {STATS.map(({ value, label }) => (
        <div key={label} style={s.cell}>
          <div style={s.val}>{value}</div>
          <div style={s.lbl}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function BadgesRow() {
  const s = {
    wrap:  { padding: '8px 8px 0' },
    title: { fontSize: 10, fontWeight: 700, color: colors.dark, marginBottom: 6 },
    row:   { display: 'flex', gap: 5 },
    card: {
      flex: 1,
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 8, padding: '7px 4px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    },
    icon:  { fontSize: 16 },
    lbl:   { fontSize: 7, fontWeight: 700, color: colors.dark },
    desc:  { fontSize: 6, color: colors.gray600, textAlign: 'center', lineHeight: 1.3 },
  };
  return (
    <div style={s.wrap}>
      <div style={s.title}>Mes badges</div>
      <div style={s.row}>
        {BADGES.map((b) => (
          <div key={b.label} style={s.card}>
            <div style={s.icon}>{b.icon}</div>
            <div style={s.lbl}>{b.label}</div>
            <div style={s.desc}>{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoSection({ user }) {
  const INFO_ROWS = [
    { label: 'Prénom',         value: user?.firstName || '-' },
    { label: 'Nom',            value: user?.lastName || '-' },
    { label: 'Téléphone',      value: user?.phoneNumber || '-' },
    { label: 'Email',          value: user?.email || '-' },
  ];
  
  const s = {
    wrap:  { padding: '8px 8px 0' },
    title: { fontSize: 10, fontWeight: 700, color: colors.dark, marginBottom: 6 },
    card: {
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 10, overflow: 'hidden',
    },
    row: (last) => ({
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 10px',
      borderBottom: last ? 'none' : `1px solid ${colors.gray100}`,
    }),
    lbl: { fontSize: 8, color: colors.gray600 },
    val: { fontSize: 8, fontWeight: 600, color: colors.dark, textAlign: 'right', maxWidth: '55%' },
  };
  return (
    <div style={s.wrap}>
      <div style={s.title}>Informations personnelles</div>
      <div style={s.card}>
        {INFO_ROWS.map(({ label, value }, i) => (
          <div key={label} style={s.row(i === INFO_ROWS.length - 1)}>
            <div style={s.lbl}>{label}</div>
            <div style={s.val}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogoutBtn({ onLogout }) {
  const s = {
    btn: {
      margin: '12px 8px 4px',
      padding: '9px 0',
      background: '#FEF2F2',
      border: `1px solid #FECACA`,
      borderRadius: 8,
      color: '#DC2626',
      fontSize: 10, fontWeight: 700,
      textAlign: 'center',
      cursor: 'pointer',
    },
  };
  return <div style={s.btn} onClick={onLogout}>Se déconnecter</div>;
}

// ─── Page ───────────────────────────────────────────────────────────────────
/**
 * ProfilePage — informations personnelles, score et badges.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);

  const handleBack = () => navigate('/dashboard');

  const handleLogout = () => {
    // TODO: Implémenter déconnexion + navigation vers /login
    navigate('/login');
  };

  const s = {
    screen: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
    scroll: { flex: 1, overflowY: 'auto' },
  };

  return (
    <div style={s.screen}>
      <ProfileHero user={authUser} onBack={handleBack} />

      <div style={s.scroll}>
        <ScoreCard user={authUser} />
        <StatsRow />
        <BadgesRow />
        <InfoSection user={authUser} />
        <LogoutBtn onLogout={handleLogout} />
        <div style={{ height: 10 }}/>
      </div>

      <ChatbotWidget />
    </div>
  );
}
