import { useNavigate } from 'react-router-dom';
import { colors } from '../theme';

/**
 * TopBar — barre supérieure partagée entre toutes les pages.
 * @param {boolean} showNotif  - affiche l'icône cloche
 * @param {string}  avatar     - initiales de l'avatar (ex: "FA")
 */
export default function TopBar({ showNotif = false, avatar = 'FA' }) {
  const navigate = useNavigate();
  const s = {
    bar: {
      background: colors.white,
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${colors.gray200}`,
      flexShrink: 0,
    },
    logo: { height: 32, display: 'flex', alignItems: 'center' },
    right: { display: 'flex', gap: 6, alignItems: 'center' },
    iconBtn: {
      width: 24, height: 24, borderRadius: '50%',
      background: colors.gray100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    av: {
      width: 24, height: 24, borderRadius: '50%',
      background: colors.primary,
      color: colors.white,
      fontSize: 8, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  };

  return (
    <div style={s.bar}>
      <img src="/logo.png" alt="Tontine+" style={s.logo} />
      <div style={s.right}>
        {showNotif && (
          <div style={{ ...s.iconBtn, cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="#4B5563" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        <div style={{ ...s.av, cursor: 'pointer' }} onClick={() => navigate('/profile')}>{avatar}</div>
      </div>
    </div>
  );
}
