import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import TopBar         from '../components/TopBar';
import BottomNav      from '../components/BottomNav';
import ChatbotWidget  from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données statiques ──────────────────────────────────────────────────────
const ALL_TONTINES = [
  {
    id: 'TON_001',
    name: 'Cercle Familial El Amrani',
    freq: 'Mensuelle · 8 membres',
    amount: '1 500 MAD',
    status: 'active',
    progress: 37,
    members: ['FA','SM','KO'],
    description: 'Tontine familiale pour épargne commune',
    category: 'Famille',
    openSpots: 3,
    joinable: true,
  },
  {
    id: 'TON_002',
    name: 'Asso Jeunes Entrepreneurs',
    freq: 'Hebdomadaire · 12 membres',
    amount: '500 MAD',
    status: 'active',
    progress: 50,
    members: ['FA','YB','NA','HM'],
    description: 'Réseau pour jeunes entrepreneurs',
    category: 'Professionnel',
    openSpots: 2,
    joinable: true,
  },
  {
    id: 'TON_003',
    name: 'Club Épargne Femmes Actives',
    freq: 'Mensuelle · 6 membres',
    amount: '2 000 MAD',
    status: 'completed',
    progress: 100,
    members: [],
    description: 'Club pour épargne et investissement',
    category: 'Femmes',
    openSpots: 0,
    joinable: false,
  },
  {
    id: 'TON_004',
    name: 'Tontine Voisinage Gueliz',
    freq: 'Bimensuelle · 10 membres',
    amount: '800 MAD',
    status: 'pending',
    progress: 0,
    members: ['FA'],
    description: 'Tontine locale pour entraide communautaire',
    category: 'Communautaire',
    openSpots: 8,
    joinable: true,
  },
  {
    id: 'TON_005',
    name: 'Réseaux Commerçants Fes',
    freq: 'Mensuelle · 15 membres',
    amount: '3 000 MAD',
    status: 'active',
    progress: 65,
    members: ['RC','BZ','TD'],
    description: 'Tontine pour commerçants et artisans',
    category: 'Professionnel',
    openSpots: 5,
    joinable: true,
  },
];

const CATEGORIES = ['Tous', 'Famille', 'Professionnel', 'Communautaire', 'Femmes'];

const STATUS_STYLE = {
  active:    { stripe: colors.primary,  badge: { bg: colors.primaryBg,  text: colors.primaryDark }, label: 'Actif'     },
  pending:   { stripe: colors.warning,  badge: { bg: '#FFFBEB',          text: '#92400E'          }, label: 'En attente'},
  completed: { stripe: colors.success,  badge: { bg: colors.successBg,   text: colors.successDark }, label: 'Terminé'   },
};

// ─── FilterButton ──────────────────────────────────────────────────────────
function FilterButton({ onClick }) {
  const s = {
    container: { padding: '12px 8px', background: colors.white, borderBottom: `1px solid ${colors.gray200}` },
    button: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 12,
      fontWeight: 700,
      border: `2px solid ${colors.primary}`,
      borderRadius: 8,
      background: colors.primary,
      color: colors.white,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
  };

  return (
    <div style={s.container}>
      <button style={s.button} onClick={onClick}>
        🔍 Chercher des tontines
      </button>
    </div>
  );
}

// ─── FilterModal ───────────────────────────────────────────────────────────
function FilterModal({ isOpen, onClose, onApply, cotisationMin, cotisationMax, montantTontine, onCotisationMinChange, onCotisationMaxChange, onMontantChange }) {
  if (!isOpen) return null;

  const s = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300,
    },
    modal: {
      background: colors.white,
      borderRadius: 16,
      padding: 24,
      maxWidth: 340,
      width: '90%',
      boxShadow: '0 10px 40px rgba(0,0,0,.2)',
      maxHeight: '80vh',
      overflowY: 'auto',
    },
    header: { fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 20 },
    field: { marginBottom: 18 },
    label: { fontSize: 10, fontWeight: 600, color: colors.gray600, marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
    rangeContainer: { display: 'flex', gap: 8, alignItems: 'center' },
    input: {
      flex: 1, boxSizing: 'border-box',
      padding: '10px 12px',
      border: `1px solid ${colors.gray200}`, borderRadius: 8,
      fontSize: 11, color: colors.dark,
      fontFamily: 'inherit',
    },
    separator: { fontSize: 12, color: colors.gray400, fontWeight: 600 },
    btnGroup: { display: 'flex', gap: 8, marginTop: 20 },
    btn: (primary) => ({
      flex: 1, padding: '12px',
      background: primary ? colors.primary : colors.gray100,
      color: primary ? colors.white : colors.dark,
      border: 'none', borderRadius: 8,
      fontSize: 11, fontWeight: 600,
      cursor: 'pointer',
      transition: 'all .2s',
    }),
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>💰 Filtrer les tontines</div>
        
        <div style={s.field}>
          <label style={s.label}>Cotisation mensuelle (intervalle)</label>
          <div style={s.rangeContainer}>
            <input
              style={s.input}
              type="number"
              placeholder="Min (MAD)"
              value={cotisationMin}
              onChange={(e) => onCotisationMinChange(e.target.value)}
              min="0"
            />
            <span style={s.separator}>—</span>
            <input
              style={s.input}
              type="number"
              placeholder="Max (MAD)"
              value={cotisationMax}
              onChange={(e) => onCotisationMaxChange(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Montant de la tontine (MAD)</label>
          <input
            style={{...s.input, flex: 'none', width: '100%'}}
            type="number"
            placeholder="Montant visé (MAD)"
            value={montantTontine}
            onChange={(e) => onMontantChange(e.target.value)}
            min="0"
          />
        </div>

        <div style={s.btnGroup}>
          <button style={s.btn(false)} onClick={onClose}>Annuler</button>
          <button style={s.btn(true)} onClick={onApply}>Appliquer</button>
        </div>
      </div>
    </div>
  );
}

// ─── CategoryFilter ─────────────────────────────────────────────────────────
function CategoryFilter({ selected, onSelect }) {
  const s = {
    container: { display: 'flex', gap: 6, padding: '8px', overflowX: 'auto', borderBottom: `1px solid ${colors.gray200}` },
    pill: (active) => ({
      padding: '6px 12px',
      borderRadius: 20,
      fontSize: 8,
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      background: active ? colors.primary : colors.gray100,
      color: active ? colors.white : colors.gray600,
      border: `1px solid ${active ? colors.primary : colors.gray200}`,
      transition: 'all 0.2s',
    }),
  };

  return (
    <div style={s.container}>
      {CATEGORIES.map(cat => (
        <div
          key={cat}
          style={s.pill(selected === cat)}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </div>
      ))}
    </div>
  );
}

// ─── TontineSearchCard ──────────────────────────────────────────────────────
function TontineSearchCard({ tontine, onJoin }) {
  const st = STATUS_STYLE[tontine.status];
  const s = {
    card: {
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 12,
      padding: 12,
      margin: '0 8px 8px',
      position: 'relative',
      overflow: 'hidden',
    },
    stripe: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      width: 4, background: st.stripe,
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, paddingLeft: 8, marginBottom: 8 },
    nameRow: { flex: 1, minWidth: 0 }, // minWidth: 0 allows flex children to shrink below content size
    name: { fontSize: 11, fontWeight: 700, color: colors.dark, marginBottom: 2, wordWrap: 'break-word', overflowWrap: 'break-word' },
    desc: { fontSize: 8, color: colors.gray600, marginBottom: 3, lineHeight: 1.4, wordWrap: 'break-word', overflowWrap: 'break-word' },
    cat: { fontSize: 7, fontWeight: 600, color: colors.primary, background: colors.primaryBg, padding: '2px 6px', borderRadius: 4, display: 'inline-block', flexShrink: 0, whiteSpace: 'nowrap' },
    badge: {
      fontSize: 7, fontWeight: 700,
      padding: '3px 8px', borderRadius: 12,
      background: st.badge.bg, color: st.badge.text,
      flexShrink: 0, whiteSpace: 'nowrap',
    },
    freqAmount: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 8, marginBottom: 8, fontSize: 9, color: colors.gray600, fontWeight: 600 },
    stats: { display: 'flex', gap: 12, paddingLeft: 8, marginBottom: 8 },
    stat: { display: 'flex', flexDirection: 'column', gap: 1 },
    statVal: { fontSize: 11, fontWeight: 700, color: colors.dark },
    statLbl: { fontSize: 7, color: colors.gray600, textTransform: 'uppercase', letterSpacing: '0.04em' },
    spots: { fontSize: 8, fontWeight: 600, color: colors.success, paddingLeft: 8, marginBottom: 8 },
    footer: { display: 'flex', gap: 6, paddingLeft: 8 },
    button: (enabled) => ({
      flex: 1,
      padding: '8px 12px',
      fontSize: 9,
      fontWeight: 700,
      border: 'none',
      borderRadius: 6,
      cursor: enabled ? 'pointer' : 'not-allowed',
      background: enabled ? colors.primary : colors.gray200,
      color: enabled ? colors.white : colors.gray400,
      transition: 'all 0.2s',
    }),
  };

  return (
    <div style={s.card}>
      <div style={s.stripe}/>
      <div style={s.header}>
        <div style={s.nameRow}>
          <div style={s.name}>{tontine.name}</div>
          <div style={s.desc}>{tontine.description}</div>
          <div style={s.cat}>{tontine.category}</div>
        </div>
        <div style={s.badge}>{st.label}</div>
      </div>

      <div style={s.freqAmount}>
        <span>{tontine.freq}</span>
        <span style={{ fontWeight: 700, color: colors.dark }}>{tontine.amount}</span>
      </div>

      <div style={s.stats}>
        <div style={s.stat}>
          <div style={s.statVal}>{tontine.members.length}</div>
          <div style={s.statLbl}>Membres</div>
        </div>
        <div style={s.stat}>
          <div style={s.statVal}>{tontine.progress}%</div>
          <div style={s.statLbl}>Complété</div>
        </div>
      </div>

      {tontine.joinable && (
        <div style={s.spots}>
          ✓ {tontine.openSpots} place{tontine.openSpots > 1 ? 's' : ''} disponible{tontine.openSpots > 1 ? 's' : ''}
        </div>
      )}

      <div style={s.footer}>
        <button style={s.button(tontine.joinable)} onClick={() => onJoin(tontine)}>
          {tontine.joinable ? '+ Rejoindre' : 'Complète'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cotisationMin, setCotisationMin] = useState('');
  const [cotisationMax, setCotisationMax] = useState('');
  const [montantTontine, setMontantTontine] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTontine, setSelectedTontine] = useState(null);
  const [cotisationMensuelle, setCotisationMensuelle] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [allTontines, setAllTontines] = useState(() => {
    // Charger les tontines créées depuis localStorage et les ajouter à la liste
    const createdTontines = JSON.parse(localStorage.getItem('createdTontines') || '[]');
    
    // Convertir les tontines créées au format SearchPage
    const formattedCreated = createdTontines.map((t, idx) => ({
      id: `CREATED_${idx}`,
      name: t.name,
      freq: t.freq,
      amount: t.amount,
      status: t.status,
      progress: t.progress,
      members: t.members,
      description: t.description || 'Nouvelle tontine créée',
      category: 'Professionnel', // Catégorie par défaut pour les tontines créées
      openSpots: 5,
      joinable: true,
    }));
    
    return [...ALL_TONTINES, ...formattedCreated];
  });

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

  const filtered = allTontines.filter(t => {
    const userInitials = getAvatarInitials(authUser);
    
    // Charger les tontines rejointes et créées de l'utilisateur
    const joinedTontines = JSON.parse(localStorage.getItem('joinedTontines') || '[]');
    const createdTontines = JSON.parse(localStorage.getItem('createdTontines') || '[]');
    
    // Vérifications d'exclusion
    const userAlreadyMember = t.members?.includes(userInitials);
    const isCompleted = t.status === 'completed';
    const isCreatedByUser = createdTontines.some(ct => ct.name === t.name);
    const isJoinedByUser = joinedTontines.some(jt => jt.id === t.id);
    
    // Extraire le montant numérique (ex: "1 500 MAD" -> 1500)
    const amountStr = t.amount.replace(/\s/g, '').replace('MAD', '');
    const tontineAmount = parseInt(amountStr) || 0;
    
    // Filtrer par cotisation mensuelle
    const minCot = cotisationMin ? parseInt(cotisationMin) : 0;
    const maxCot = cotisationMax ? parseInt(cotisationMax) : Infinity;
    const matchesCotisation = tontineAmount >= minCot && tontineAmount <= maxCot;
    
    // Filtrer par montant de la tontine (si spécifié)
    const matchesMontant = !montantTontine || tontineAmount === parseInt(montantTontine);
    
    // Filtrer par catégorie
    const matchesCategory = selectedCategory === 'Tous' || t.category === selectedCategory;
    
    // Afficher uniquement si: matches cotisation ET montant ET catégorie ET n'est pas complète ET conditions d'exclusion
    return matchesCotisation && matchesMontant && matchesCategory && !isCompleted && !userAlreadyMember && !isCreatedByUser && !isJoinedByUser;
  });

  const handleJoin = (tontine) => {
    setSelectedTontine(tontine);
    setShowJoinModal(true);
    setCotisationMensuelle('');
    setJoinSuccess(false);
  };

  const handleSubmitJoin = () => {
    if (!cotisationMensuelle || cotisationMensuelle <= 0) {
      alert('Veuillez entrer une cotisation valide');
      return;
    }
    
    // Ajouter l'utilisateur aux members de la tontine
    const userInitials = getAvatarInitials(authUser);
    console.log('SearchPage: Join request - authUser:', authUser, 'userInitials:', userInitials);
    
    const updatedMembers = selectedTontine.members ? [...selectedTontine.members] : [];
    if (!updatedMembers.includes(userInitials)) {
      updatedMembers.push(userInitials);
    }
    
    // Sauvegarder la tontine rejointe avec statut "pending" (en attente)
    const joinedTontine = {
      id: selectedTontine.id,
      name: selectedTontine.name,
      freq: selectedTontine.freq,
      amount: selectedTontine.amount,
      status: 'pending', // En attente de validation
      progress: 0,
      members: updatedMembers,
      turn: null,
      description: selectedTontine.description,
      cotisationMensuelle: cotisationMensuelle,
      dateAdhesion: new Date().toISOString(),
    };
    
    console.log('SearchPage: Saving joined tontine:', joinedTontine);
    
    // Charger les tontines rejointes existantes
    const joinedTontines = JSON.parse(localStorage.getItem('joinedTontines') || '[]');
    
    // Vérifier si la tontine n'est pas déjà rejointe
    const alreadyJoined = joinedTontines.some(t => t.id === selectedTontine.id);
    if (!alreadyJoined) {
      joinedTontines.push(joinedTontine);
      localStorage.setItem('joinedTontines', JSON.stringify(joinedTontines));
      console.log('SearchPage: Saved to localStorage. Total joined tontines:', joinedTontines.length);
    } else {
      console.log('SearchPage: Already joined this tontine');
    }
    
    // Afficher le message de succès
    setJoinSuccess(true);
    setCotisationMensuelle('');
    
    // Fermer le modal après 3 secondes
    setTimeout(() => {
      setShowJoinModal(false);
      setJoinSuccess(false);
      setSelectedTontine(null);
    }, 3000);
  };

  const s = {
    screen: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
    scroll: { flex: 1, overflowY: 'auto' },
    resultHd: { padding: '12px 8px', fontSize: 9, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    empty: {
      padding: '32px 16px',
      textAlign: 'center',
      color: colors.gray400,
      fontSize: 11,
    },
  };

  // Styles pour le modal
  const modalStyles = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300,
    },
    modal: {
      background: colors.white,
      borderRadius: 16,
      padding: 24,
      maxWidth: 320,
      width: '90%',
      boxShadow: '0 10px 40px rgba(0,0,0,.2)',
    },
    header: { fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 },
    field: { marginBottom: 16 },
    label: { fontSize: 9, fontWeight: 600, color: colors.gray600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: {
      width: '100%', boxSizing: 'border-box',
      padding: '10px 12px',
      border: `1px solid ${colors.gray200}`, borderRadius: 8,
      fontSize: 11, color: colors.dark,
      fontFamily: 'inherit',
    },
    btnGroup: { display: 'flex', gap: 8, marginTop: 16 },
    btn: (primary) => ({
      flex: 1, padding: '10px',
      background: primary ? colors.primary : colors.gray100,
      color: primary ? colors.white : colors.dark,
      border: 'none', borderRadius: 8,
      fontSize: 10, fontWeight: 600,
      cursor: 'pointer',
      transition: 'all .2s',
    }),
    successBox: {
      background: colors.successBg,
      border: `2px solid ${colors.success}`,
      borderRadius: 12,
      padding: 16,
      textAlign: 'center',
    },
    successIcon: { fontSize: 36, marginBottom: 8 },
    successText: { fontSize: 11, fontWeight: 600, color: colors.successDark, marginBottom: 6 },
    successSubtext: { fontSize: 9, color: colors.gray600 },
  };

  return (
    <div style={s.screen}>
      <TopBar showNotif avatar={getAvatarInitials(authUser)} />
      
      <FilterButton onClick={() => setShowFilterModal(true)} />
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      <div style={s.scroll}>
        {filtered.length > 0 ? (
          <>
            <div style={s.resultHd}>
              {filtered.length} tontine{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
            </div>
            {filtered.map(t => (
              <TontineSearchCard key={t.id} tontine={t} onJoin={handleJoin} />
            ))}
            <div style={{ height: 10 }} />
          </>
        ) : (
          <div style={s.empty}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div>Aucune tontine trouvée</div>
            <div style={{ fontSize: 9, marginTop: 4, color: colors.gray400 }}>Essayez d'autres critères de filtrage</div>
          </div>
        )}
      </div>

      {/* Modal de filtre */}
      <FilterModal 
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={() => setShowFilterModal(false)}
        cotisationMin={cotisationMin}
        cotisationMax={cotisationMax}
        montantTontine={montantTontine}
        onCotisationMinChange={setCotisationMin}
        onCotisationMaxChange={setCotisationMax}
        onMontantChange={setMontantTontine}
      />

      {/* Modal de cotisation */}
      {showJoinModal && (
        <div style={modalStyles.overlay} onClick={() => !joinSuccess && setShowJoinModal(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            {!joinSuccess ? (
              <>
                <div style={modalStyles.header}>Rejoindre la tontine</div>
                <div style={{ fontSize: 10, color: colors.gray600, marginBottom: 16 }}>
                  {selectedTontine?.name}
                </div>
                
                <div style={modalStyles.field}>
                  <label style={modalStyles.label}>Cotisation mensuelle (MAD) *</label>
                  <input
                    style={modalStyles.input}
                    type="number"
                    placeholder="Ex: 1500"
                    value={cotisationMensuelle}
                    onChange={(e) => setCotisationMensuelle(e.target.value)}
                  />
                </div>

                <div style={modalStyles.btnGroup}>
                  <button style={modalStyles.btn(false)} onClick={() => setShowJoinModal(false)}>
                    Annuler
                  </button>
                  <button style={modalStyles.btn(true)} onClick={handleSubmitJoin}>
                    Valider
                  </button>
                </div>
              </>
            ) : (
              <div style={modalStyles.successBox}>
                <div style={modalStyles.successIcon}>✓</div>
                <div style={modalStyles.successText}>Demande envoyée!</div>
                <div style={modalStyles.successSubtext}>
                  Vous recevrez une réponse de validation dans 48h
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav activePage="recherche" onNavigate={handleNavigate} />
    </div>
  );
}
