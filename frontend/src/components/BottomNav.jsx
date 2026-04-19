import { colors } from '../theme';

const NAV_ITEMS = [
  {
    key: 'accueil', label: 'Accueil',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? colors.primary : colors.gray400} strokeWidth="2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'recherche', label: 'Recherche',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? colors.primary : colors.gray400} strokeWidth="2">
        <circle cx="11" cy="11" r="7"/>
        <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'objectifs', label: 'Objectifs',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? colors.primary : colors.gray400} strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1" fill={active ? colors.primary : colors.gray400}/>
      </svg>
    ),
  },
  {
    key: 'messages', label: 'Messages', badge: 3,
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? colors.primary : colors.gray400} strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'formation', label: 'Formation',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? colors.primary : colors.gray400} strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

/**
 * BottomNav — barre de navigation inférieure.
 * @param {string}   activePage - clé de la page active (ex: 'accueil')
 * @param {Function} onNavigate - callback(key: string)
 */
export default function BottomNav({ activePage, onNavigate }) {
  const s = {
    nav: {
      background: colors.white,
      borderTop: `1px solid ${colors.gray200}`,
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      height: 48,
    },
    tab: (active) => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      cursor: 'pointer',
      position: 'relative',
    }),
    label: (active) => ({
      fontSize: 8,
      fontWeight: active ? 700 : 500,
      color: active ? colors.primary : colors.gray400,
    }),
    dot: {
      width: 3, height: 3, borderRadius: '50%',
      background: colors.primary,
      position: 'absolute', top: 4,
    },
    badge: {
      position: 'absolute', top: 3, right: 'calc(50% - 14px)',
      background: colors.danger, color: colors.white,
      fontSize: 7, fontWeight: 700,
      width: 13, height: 13, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1.5px solid ${colors.white}`,
    },
  };

  return (
    <div style={s.nav}>
      {NAV_ITEMS.map(({ key, label, icon, badge }) => {
        const active = activePage === key;
        return (
          <div key={key} style={s.tab(active)} onClick={() => onNavigate?.(key)}>
            {active && <div style={s.dot}/>}
            {badge && !active && <div style={s.badge}>{badge}</div>}
            {badge && active  && <div style={s.badge}>{badge}</div>}
            {icon(active)}
            <div style={s.label(active)}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
