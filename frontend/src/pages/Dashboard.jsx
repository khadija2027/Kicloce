import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import TopBar         from '../components/TopBar';
import BottomNav      from '../components/BottomNav';
import ChatbotWidget  from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données statiques ──────────────────────────────────────────────────────

const TONTINES = [
  {
    name:     'Cercle Familial El Amrani',
    freq:     'Mensuelle · 8 membres',
    amount:   '1 500 MAD',
    status:   'active',
    progress: 37,
    members:  ['FE','SM','KO'],
    turn:     'Votre tour: #5',
  },
  {
    name:     'Asso Jeunes Entrepreneurs',
    freq:     'Hebdomadaire · 12 membres',
    amount:   '500 MAD',
    status:   'active',
    progress: 50,
    members:  ['FE','YB','NA','HM'],
    turn:     null,
  },
  {
    name:     'Club Épargne Femmes Actives',
    freq:     'Mensuelle · 6 membres',
    amount:   '2 000 MAD',
    status:   'completed',
    progress: 100,
    members:  [],
    turn:     null,
  },
  {
    name:     'Tontine Voisinage Gueliz',
    freq:     'Bimensuelle · 10 membres',
    amount:   '800 MAD',
    status:   'pending',
    progress: 0,
    members:  ['FE'],
    turn:     null,
  },
];

const STATUS_STYLE = {
  active:    { stripe: colors.primary,  badge: { bg: colors.primaryBg,  text: colors.primaryDark }, label: 'Actif'     },
  pending:   { stripe: colors.warning,  badge: { bg: '#FFFBEB',          text: '#92400E'          }, label: 'En attente'},
  completed: { stripe: colors.success,  badge: { bg: colors.successBg,   text: colors.successDark }, label: 'Terminé'   },
};

// ─── Sous-composants ────────────────────────────────────────────────────────
function TontineFilter({ selectedFilter = 'all', onFilterChange }) {
  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actif' },
    { key: 'pending', label: 'En attente' },
    { key: 'completed', label: 'Terminée' },
  ];
  
  const s = {
    container: { display: 'flex', gap: 6, padding: '0 8px', marginBottom: 8, overflowX: 'auto', scrollBehavior: 'smooth' },
    btn: (isActive) => ({
      padding: '6px 12px',
      background: isActive ? colors.primary : colors.gray100,
      color: isActive ? colors.white : colors.dark,
      border: 'none',
      borderRadius: 12,
      fontSize: 9,
      fontWeight: 600,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all .2s',
    }),
  };
  
  return (
    <div style={s.container}>
      {filters.map(f => (
        <button
          key={f.key}
          style={s.btn(selectedFilter === f.key)}
          onClick={() => onFilterChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function WalletCard({ user, onDeposit, onWithdraw, onTransfer }) {
  const s = {
    card: {
      background: colors.primary,
      margin: 8, borderRadius: 12,
      padding: 12, color: colors.white,
      flexShrink: 0,
    },
    label:  { fontSize: 8,  color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
    amount: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 1 },
    sub:    { fontSize: 8,  color: 'rgba(255,255,255,.6)' },
    btns:   { display: 'flex', gap: 5, marginTop: 8 },
    btn: {
      flex: 1, padding: 5,
      background: 'rgba(255,255,255,.15)',
      border: '1px solid rgba(255,255,255,.2)',
      borderRadius: 6, color: colors.white,
      fontSize: 7, fontWeight: 600, textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
  };
  
  const balance = user?.walletBalance || 0;
  
  return (
    <div style={s.card}>
      <div style={s.label}>Solde Wallet</div>
      <div style={s.amount}>{balance.toLocaleString()} MAD</div>
      <div style={s.sub}>Prochain versement: 1 500 MAD — Vendredi</div>
      <div style={s.btns}>
        <button style={s.btn} onClick={onDeposit}>↑ Déposer</button>
        <button style={s.btn} onClick={onWithdraw}>↓ Retirer</button>
        <button style={s.btn} onClick={onTransfer}>⇄ Transférer</button>
      </div>
    </div>
  );
}

function KpiGrid({ kpiData = [] }) {
  const s = {
    grid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '0 8px', marginBottom: 8 },
    card:  { background: colors.gray50, borderRadius: 8, padding: 8 },
    lbl:   { fontSize: 7, color: colors.gray600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
    val:   { fontSize: 15, fontWeight: 700, color: colors.dark },
    det:   (warn) => ({ fontSize: 7, color: warn ? colors.warning : colors.success, marginTop: 1 }),
  };
  return (
    <div style={s.grid}>
      {kpiData.map(({ label, value, detail, warn }) => (
        <div key={label} style={s.card}>
          <div style={s.lbl}>{label}</div>
          <div style={s.val}>{value}</div>
          <div style={s.det(warn)}>{detail}</div>
        </div>
      ))}
    </div>
  );
}

function TontineCard({ tontine, onDelete }) {
  const st = STATUS_STYLE[tontine.status];
  const s = {
    card: {
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 10, padding: 8,
      margin: '0 8px 6px',
      position: 'relative', overflow: 'hidden',
    },
    stripe: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      width: 3, background: st.stripe,
    },
    name:   { fontSize: 10, fontWeight: 600, color: colors.dark,    paddingLeft: 6, marginBottom: 1 },
    freq:   { fontSize: 8,  color: colors.gray600,                   paddingLeft: 6, marginBottom: 4 },
    row:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 6 },
    amount: { fontSize: 12, fontWeight: 700, color: colors.dark },
    badge:  {
      fontSize: 7, fontWeight: 700,
      padding: '2px 6px', borderRadius: 10,
      background: st.badge.bg, color: st.badge.text,
    },
    progWrap: {
      height: 4, background: colors.gray100,
      borderRadius: 2, overflow: 'hidden',
      margin: '4px 0 4px 6px',
    },
    progFill: {
      height: '100%', borderRadius: 2,
      background: tontine.status === 'completed' ? colors.success : colors.primary,
      width: `${tontine.progress}%`,
      transition: 'width .4s',
    },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 6 },
    members:{ display: 'flex' },
    mav: (i) => ({
      width: 16, height: 16, borderRadius: '50%',
      background: colors.primaryBg, color: colors.primary,
      fontSize: 6, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${colors.white}`,
      marginLeft: i === 0 ? 0 : -3,
    }),
    turn: {
      fontSize: 7, color: colors.primary, fontWeight: 600,
      background: colors.primaryBg, padding: '2px 6px', borderRadius: 8,
    },
    deleteBtn: {
      position: 'absolute', top: 6, right: 6,
      background: colors.danger, color: colors.white,
      border: 'none', borderRadius: 6,
      padding: '4px 8px', fontSize: 7, fontWeight: 600,
      cursor: 'pointer', opacity: tontine.status === 'pending' ? 1 : 0.3,
      pointerEvents: tontine.status === 'pending' ? 'auto' : 'none',
      transition: 'all .2s',
    },
  };

  return (
    <div style={s.card}>
      <div style={s.stripe}/>
      {tontine.status === 'pending' && (
        <button style={s.deleteBtn} onClick={() => onDelete?.(tontine)}>✕</button>
      )}
      <div style={s.name}>{tontine.name}</div>
      <div style={s.freq}>{tontine.freq}</div>
      <div style={s.row}>
        <div style={s.amount}>{tontine.amount}</div>
        <div style={s.badge}>{st.label}</div>
      </div>
      <div style={s.progWrap}><div style={s.progFill}/></div>
      {(tontine.members.length > 0 || tontine.turn) && (
        <div style={s.footer}>
          <div style={s.members}>
            {tontine.members.map((m, i) => (
              <div key={m + i} style={s.mav(i)}>{m}</div>
            ))}
          </div>
          {tontine.turn && <div style={s.turn}>{tontine.turn}</div>}
        </div>
      )}
    </div>
  );
}

// ─── CreateTontineForm ──────────────────────────────────────────────────────
function CreateTontineForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    commission: '',
    montantTontine: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nom || !formData.commission || !formData.montantTontine) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSubmit(formData);
    setFormData({ nom: '', description: '', commission: '', montantTontine: '' });
  };

  const s = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'flex-end',
      zIndex: 200,
    },
    modal: {
      background: colors.white,
      borderRadius: '12px 12px 0 0',
      width: '100%',
      maxWidth: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      padding: '16px 12px 24px',
      animation: 'slideUp .3s ease-out',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12, borderBottom: `1px solid ${colors.gray200}`,
    },
    title: { fontSize: 12, fontWeight: 700, color: colors.dark },
    closeBtn: {
      width: 28, height: 28, borderRadius: '50%',
      background: colors.gray100,
      border: 'none', cursor: 'pointer',
      fontSize: 12, color: colors.dark,
    },
    field: { marginBottom: 12 },
    label: { fontSize: 9, fontWeight: 600, color: colors.dark, marginBottom: 4, display: 'block' },
    input: {
      width: '100%', boxSizing: 'border-box',
      padding: '8px 10px',
      border: `1px solid ${colors.gray200}`, borderRadius: 6,
      fontSize: 9, color: colors.dark,
      fontFamily: 'inherit',
    },
    textarea: {
      width: '100%', boxSizing: 'border-box',
      padding: '8px 10px',
      border: `1px solid ${colors.gray200}`, borderRadius: 6,
      fontSize: 9, color: colors.dark,
      fontFamily: 'inherit',
      resize: 'vertical', minHeight: 60,
    },
    btnGroup: { display: 'flex', gap: 8, marginTop: 16 },
    btn: (primary) => ({
      flex: 1, padding: '10px',
      background: primary ? colors.primary : colors.gray100,
      color: primary ? colors.white : colors.dark,
      border: 'none', borderRadius: 6,
      fontSize: 10, fontWeight: 600,
      cursor: 'pointer',
      transition: 'all .2s',
    }),
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      <div style={s.overlay} onClick={onClose}>
        <div style={s.modal} onClick={(e) => e.stopPropagation()}>
          <div style={s.header}>
            <div style={s.title}>Créer une tontine</div>
            <button style={s.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div style={s.field}>
            <label style={s.label}>Nom de la tontine *</label>
            <input
              style={s.input}
              type="text"
              name="nom"
              placeholder="Ex: Cercle Familial"
              value={formData.nom}
              onChange={handleChange}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Description</label>
            <textarea
              style={s.textarea}
              name="description"
              placeholder="Décrivez les objectifs..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={s.field}>
              <label style={s.label}>Commission/personne/moi *</label>
              <input
                style={s.input}
                type="number"
                name="commission"
                placeholder="Ex: 500"
                value={formData.commission}
                onChange={handleChange}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Montant de la tontine *</label>
              <input
                style={s.input}
                type="number"
                name="montantTontine"
                placeholder="Ex: 12000"
                value={formData.montantTontine}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={s.btnGroup}>
            <button style={s.btn(false)} onClick={onClose}>Annuler</button>
            <button style={s.btn(true)} onClick={handleSubmit}>Créer tontine</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
/**
 * DashboardPage — tableau de bord principal.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tontineToDelete, setTontineToDelete] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  
  // 💳 Estados del Depósito (Wallet Deposit)
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositStep, setDepositStep] = useState('form'); // 'form' | 'simulation' | 'confirmation' | 'success'
  const [depositFormData, setDepositFormData] = useState({
    contractId: authUser?.contractId || 'LAN230325007133701',
    level: '2',
    phoneNumber: authUser?.phoneNumber || '212700446631',
    amount: '',
    fees: '0',
  });
  const [simulationData, setSimulationData] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState(null);
  
  const [tontines, setTontines] = useState(() => {
    // Charger les tontines créées et rejointes depuis localStorage
    const savedCreated = localStorage.getItem('createdTontines');
    const savedJoined = localStorage.getItem('joinedTontines');
    
    const created = savedCreated ? JSON.parse(savedCreated) : [];
    const joined = savedJoined ? JSON.parse(savedJoined) : [];
    
    // Ajouter les tontines statiques UNIQUEMENT si l'utilisateur en est membre
    const userInitials = 'FE'; // Fallback à 'FE' au démarrage
    const staticUserTontines = TONTINES.filter(t => t.members?.includes(userInitials));
    
    return [...staticUserTontines, ...created, ...joined];
  });

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

  // Recharger les tontines depuis localStorage chaque fois que la page est affichée
  const location = useLocation();
  useEffect(() => {
    const savedCreated = localStorage.getItem('createdTontines');
    const savedJoined = localStorage.getItem('joinedTontines');
    
    const created = savedCreated ? JSON.parse(savedCreated) : [];
    const joined = savedJoined ? JSON.parse(savedJoined) : [];
    
    // Ajouter les tontines statiques UNIQUEMENT si l'utilisateur en est membre
    const userInitials = 'FE'; // Fallback à 'FE' au démarrage
    const staticUserTontines = TONTINES.filter(t => t.members?.includes(userInitials));
    
    const allTontines = [...staticUserTontines, ...created, ...joined];
    console.log('Dashboard: Loaded', allTontines.length, 'tontines (static:', staticUserTontines.length, '+ created:', created.length, '+ joined:', joined.length + ')');
    if (joined.length > 0) {
      console.log('Joined tontines:', joined.map(t => ({ name: t.name, members: t.members, status: t.status })));
    }
    setTontines(allTontines);
  }, [location]);

  // Récupérer l'utilisateur actuel depuis le store
  const authUser = useAuthStore(state => state.user);
  
  // Calculer l'avatar (initiales du prénom + nom)
  const getAvatarInitials = (user) => {
    if (!user) return 'FA';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Filtrer les tontines de l'utilisateur actuel
  // Les tontines sont déjà filtrées au chargement, on les retourne directement
  const userTontines = useMemo(() => {
    console.log('User tontines count:', tontines.length);
    return tontines;
  }, [tontines]);

  // Calcul dynamique des KPIs basé sur les tontines actuelles
  const kpiData = useMemo(() => {
    const activeTontines = userTontines.filter(t => t.status === 'active');
    
    // Calculer le nombre total de membres en parsant la freq
    const totalMembers = userTontines.reduce((sum, t) => {
      const match = t.freq.match(/(\d+)\s+membres/i);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    
    // Calculer le total épargné en parsant les montants
    const totalSaved = userTontines.reduce((sum, t) => {
      const match = t.amount.match(/(\d+(?:\s*\d+)*)/);
      return sum + (match ? parseInt(match[1].replace(/\s/g, '')) : 0);
    }, 0);
    
    // Formater le montant total
    let totalSavedFormatted = '0';
    if (totalSaved >= 1000000) {
      totalSavedFormatted = (totalSaved / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (totalSaved >= 1000) {
      totalSavedFormatted = (totalSaved / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      totalSavedFormatted = String(totalSaved);
    }
    
    return [
      { label: 'Tontines',     value: String(userTontines.length), detail: activeTontines.length + ' actives', warn: false },
      { label: 'Total épargné',value: totalSavedFormatted, detail: '+12% ce mois', warn: false },
      { label: 'Membres',      value: String(totalMembers), detail: activeTontines.length + ' groupes', warn: false },
      { label: 'Score',        value: String(authUser?.score || 85), detail: 'Ponctualité', warn: false },
    ];
  }, [userTontines, authUser]);

  // Tontines triées par statut (actif > en attente > terminé) et filtrées
  const filteredTontines = useMemo(() => {
    const statusPriority = { active: 0, pending: 1, completed: 2 };
    let result = [...userTontines].sort((a, b) => 
      (statusPriority[a.status] || 999) - (statusPriority[b.status] || 999)
    );
    
    if (selectedFilter !== 'all') {
      result = result.filter(t => t.status === selectedFilter);
    }
    
    return result;
  }, [userTontines, selectedFilter]);

  const handleDeleteTontine = (tontineToDeleteData) => {
    setTontineToDelete(tontineToDeleteData);
    setShowDeleteConfirm(true);
    setDeleteConfirmed(false);
  };

  const confirmDeleteTontine = () => {
    if (!tontineToDelete) return;
    
    // Supprimer des tontines rejointes
    const joinedTontines = JSON.parse(localStorage.getItem('joinedTontines') || '[]');
    const updatedJoined = joinedTontines.filter(t => t.id !== tontineToDelete.id);
    localStorage.setItem('joinedTontines', JSON.stringify(updatedJoined));
    
    // Mettre à jour la liste locale
    const updatedTontines = tontines.filter(t => t.id !== tontineToDelete.id && t.name !== tontineToDelete.name);
    setTontines(updatedTontines);
    
    console.log(`Tontine "${tontineToDelete.name}" supprimée`);
    
    // Afficher le message de succès
    setDeleteConfirmed(true);
    
    // Fermer le modal après 2 secondes
    setTimeout(() => {
      setShowDeleteConfirm(false);
      setDeleteConfirmed(false);
      setTontineToDelete(null);
    }, 2000);
  };

  const handleCreateTontine = (formData) => {
    // Créer une nouvelle tontine avec les données du formulaire
    const newTontine = {
      name: formData.nom,
      freq: `Commission: ${formData.commission} MAD`,
      amount: `${formData.montantTontine} MAD`,
      status: 'active',
      progress: 0,
      members: ['FA'], // Créateur du groupe
      turn: null,
      description: formData.description,
    };

    // Ajouter à la liste locale
    const updatedTontines = [newTontine, ...tontines];
    setTontines(updatedTontines);

    // Sauvegarder dans localStorage
    const createdTontines = JSON.parse(localStorage.getItem('createdTontines') || '[]');
    createdTontines.push(newTontine);
    localStorage.setItem('createdTontines', JSON.stringify(createdTontines));

    setShowCreateForm(false);
    alert(`Tontine "${formData.nom}" créée avec succès!`);
  };

  const s = {
    screen: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
    scroll: { flex: 1, overflowY: 'auto' },
    secHd:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: 6 },
    secT:   { fontSize: 11, fontWeight: 700, color: colors.dark },
    secA:   { fontSize: 9,  color: colors.primary, cursor: 'pointer' },
  };

  // 💳 Fonctions pour le dépôt wallet (Cash IN)
  const handleDepositSimulation = async () => {
    try {
      setDepositLoading(true);
      setDepositError(null);
      
      const response = await fetch('/api/wallet/cash/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...depositFormData,
          step: 'simulation'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      console.log('✅ Simulation successful:', data);
      setSimulationData(data.result);
      setDepositStep('confirmation');
    } catch (error) {
      console.error('❌ Simulation error:', error);
      setDepositError(error.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositConfirmation = async () => {
    try {
      setDepositLoading(true);
      setDepositError(null);

      const response = await fetch('/api/wallet/cash/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: simulationData.token,
          amount: depositFormData.amount,
          fees: depositFormData.fees,
          step: 'confirmation'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Confirmation failed');
      }

      console.log('✅ Confirmation successful:', data);
      setDepositStep('success');
      
      // Reset after 2 seconds
      setTimeout(() => {
        setShowDepositModal(false);
        setDepositStep('form');
        setSimulationData(null);
        setDepositFormData({ ...depositFormData, amount: '' });
      }, 2000);
    } catch (error) {
      console.error('❌ Confirmation error:', error);
      setDepositError(error.message);
    } finally {
      setDepositLoading(false);
    }
  };

  // Styles pour le modal de confirmation de suppression
  const deleteConfirmStyles = {
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
    dangerBox: {
      background: colors.dangerBg,
      border: `2px solid ${colors.danger}`,
      borderRadius: 12,
      padding: 16,
      textAlign: 'center',
      marginBottom: 16,
    },
    dangerIcon: { fontSize: 36, marginBottom: 8, color: colors.danger },
    dangerText: { fontSize: 11, fontWeight: 600, color: colors.dangerDark, marginBottom: 6 },
    dangerSubtext: { fontSize: 9, color: colors.gray600, marginBottom: 12 },
    btnGroup: { display: 'flex', gap: 8 },
    btn: (danger) => ({
      flex: 1, padding: '10px',
      background: danger ? colors.danger : colors.gray100,
      color: danger ? colors.white : colors.dark,
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
    successText: { fontSize: 11, fontWeight: 600, color: colors.successDark },
    successSubtext: { fontSize: 9, color: colors.gray600, marginTop: 4 },
  };

  return (
    <div style={s.screen}>
      <TopBar showNotif avatar={getAvatarInitials(authUser)} />

      <div style={s.scroll}>
        <WalletCard 
          user={authUser}
          onDeposit={() => setShowDepositModal(true)}
          onWithdraw={() => alert('Retrait en développement...')}
          onTransfer={() => alert('Transfert en développement...')}
        />
        <KpiGrid kpiData={kpiData} />

        <div style={s.secHd}>
          <div style={s.secT}>Mes tontines</div>
          <button
            style={{
              background: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all .2s',
            }}
            onClick={() => setShowCreateForm(true)}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            + Créer une tontine
          </button>
        </div>

        <TontineFilter selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />

        {filteredTontines.map((t) => <TontineCard key={t.name} tontine={t} onDelete={handleDeleteTontine} />)}
        <div style={{ height: 10 }}/>
      </div>

      {showCreateForm && <CreateTontineForm onClose={() => setShowCreateForm(false)} onSubmit={handleCreateTontine} />}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div style={deleteConfirmStyles.overlay} onClick={() => !deleteConfirmed && setShowDeleteConfirm(false)}>
          <div style={deleteConfirmStyles.modal} onClick={(e) => e.stopPropagation()}>
            {!deleteConfirmed ? (
              <>
                <div style={deleteConfirmStyles.dangerBox}>
                  <div style={deleteConfirmStyles.dangerIcon}>⚠️</div>
                  <div style={deleteConfirmStyles.dangerText}>Supprimer la demande?</div>
                </div>
                
                <div style={{ fontSize: 9, color: colors.gray600, marginBottom: 16, textAlign: 'center', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, color: colors.dangerDark, marginBottom: 4 }}>{tontineToDelete?.name}</div>
                  Cette action ne peut pas être annulée.
                </div>

                <div style={deleteConfirmStyles.btnGroup}>
                  <button style={deleteConfirmStyles.btn(false)} onClick={() => setShowDeleteConfirm(false)}>
                    Annuler
                  </button>
                  <button style={deleteConfirmStyles.btn(true)} onClick={confirmDeleteTontine}>
                    Supprimer
                  </button>
                </div>
              </>
            ) : (
              <div style={deleteConfirmStyles.successBox}>
                <div style={deleteConfirmStyles.successIcon}>✓</div>
                <div style={deleteConfirmStyles.successText}>Demande supprimée!</div>
                <div style={deleteConfirmStyles.successSubtext}>
                  La demande a été annulée
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💳 Modal de Dépôt (Cash IN) */}
      {showDepositModal && (
        <div style={deleteConfirmStyles.overlay} onClick={() => !depositLoading && setShowDepositModal(false)}>
          <div style={{ ...deleteConfirmStyles.modal, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            {depositStep === 'form' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>💳 Charger mon wallet</div>
                
                <div style={{ fontSize: 9, color: colors.gray600, marginBottom: 12, padding: '8px 12px', background: colors.primaryBg, borderRadius: 6 }}>
                  ⚠️ Simulation: Entrez les informations et validez. Confirmation: Approuvez la transaction.
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 9, fontWeight: 600, color: colors.dark, display: 'block', marginBottom: 4 }}>Montant (MAD)</label>
                  <input 
                    type="number" 
                    value={depositFormData.amount} 
                    onChange={(e) => setDepositFormData({ ...depositFormData, amount: e.target.value })}
                    placeholder="Ex: 500"
                    style={{ width: '100%', padding: '8px', border: `1px solid ${colors.gray300}`, borderRadius: 6, fontSize: 10 }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 9, fontWeight: 600, color: colors.dark, display: 'block', marginBottom: 4 }}>N° Téléphone</label>
                  <input 
                    type="text" 
                    value={depositFormData.phoneNumber} 
                    onChange={(e) => setDepositFormData({ ...depositFormData, phoneNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: `1px solid ${colors.gray300}`, borderRadius: 6, fontSize: 10 }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 9, fontWeight: 600, color: colors.dark, display: 'block', marginBottom: 4 }}>ID Contrat</label>
                  <input 
                    type="text" 
                    value={depositFormData.contractId} 
                    onChange={(e) => setDepositFormData({ ...depositFormData, contractId: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: `1px solid ${colors.gray300}`, borderRadius: 6, fontSize: 10 }}
                  />
                </div>

                {depositError && (
                  <div style={{ fontSize: 9, color: colors.danger, marginBottom: 12, padding: '8px', background: colors.dangerBg, borderRadius: 6 }}>
                    ❌ {depositError}
                  </div>
                )}

                <div style={deleteConfirmStyles.btnGroup}>
                  <button style={deleteConfirmStyles.btn(false)} onClick={() => setShowDepositModal(false)} disabled={depositLoading}>
                    Annuler
                  </button>
                  <button 
                    style={{ ...deleteConfirmStyles.btn(true), opacity: depositLoading ? 0.6 : 1 }} 
                    onClick={handleDepositSimulation}
                    disabled={!depositFormData.amount || depositLoading}
                  >
                    {depositLoading ? '⏳ Simulation...' : '→ Simuler'}
                  </button>
                </div>
              </>
            )}

            {depositStep === 'confirmation' && simulationData && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>✅ Confirmer le dépôt</div>
                
                <div style={{ background: colors.gray50, padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 9 }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: colors.gray600 }}>Montant:</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{depositFormData.amount} MAD</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: colors.gray600 }}>Frais:</div>
                    <div style={{ fontWeight: 600 }}>{simulationData.Fees || '0'} MAD</div>
                  </div>
                  <div style={{ borderTop: `1px solid ${colors.gray300}`, paddingTop: 8, marginTop: 8 }}>
                    <div style={{ color: colors.gray600 }}>Total à prélever:</div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: colors.primary }}>{simulationData.amountToCollect || depositFormData.amount} MAD</div>
                  </div>
                </div>

                {depositError && (
                  <div style={{ fontSize: 9, color: colors.danger, marginBottom: 12, padding: '8px', background: colors.dangerBg, borderRadius: 6 }}>
                    ❌ {depositError}
                  </div>
                )}

                <div style={deleteConfirmStyles.btnGroup}>
                  <button style={deleteConfirmStyles.btn(false)} onClick={() => setDepositStep('form')} disabled={depositLoading}>
                    ← Retour
                  </button>
                  <button 
                    style={{ ...deleteConfirmStyles.btn(true), opacity: depositLoading ? 0.6 : 1 }} 
                    onClick={handleDepositConfirmation}
                    disabled={depositLoading}
                  >
                    {depositLoading ? '⏳ Confirmation...' : '✓ Confirmer'}
                  </button>
                </div>
              </>
            )}

            {depositStep === 'success' && (
              <div style={deleteConfirmStyles.successBox}>
                <div style={deleteConfirmStyles.successIcon}>✓</div>
                <div style={deleteConfirmStyles.successText}>Dépôt réussi!</div>
                <div style={deleteConfirmStyles.successSubtext}>
                  {depositFormData.amount} MAD ont été ajoutés à votre wallet
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatbotWidget />
      <BottomNav activePage="accueil" onNavigate={handleNavigate} />
    </div>
  );
}
