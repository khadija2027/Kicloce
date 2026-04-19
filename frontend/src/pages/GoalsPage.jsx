import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import TopBar         from '../components/TopBar';
import BottomNav      from '../components/BottomNav';
import ChatbotWidget  from '../components/ChatbotWidget';
import { colors } from '../theme';

// ─── Données ────────────────────────────────────────────────────────────────
const KPI = [
  { value: '73%',  label: 'Taux réalisation' },
  { value: '1',    label: 'Objectif atteint' },
  { value: '132K', label: 'Total visé (MAD)' },
  { value: '4.2K', label: 'Épargne/mois' },
];

// Progression mensuelle (%) pour le graphique Achat Voiture
const CHART_DATA = [42, 51, 68, 72, 89, 100, 100, 100, 100, 100, 100, 100];
const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const FILLED_BARS = 6; // barres bleues (données réelles)

const GOALS = [
  { name: 'Achat Voiture',  current: 52000,  total: 80000,  deadline: 'Juin 2025'  },
  { name: 'Voyage famille', current: 18500,  total: 25000,  deadline: 'Août 2024'  },
  { name: 'Fonds urgence',  current: 15000,  total: 15000,  deadline: 'Atteint'    },
  { name: 'Formation pro',  current: 3200,   total: 12000,  deadline: 'Déc 2025'   },
];

// ─── Sous-composants ────────────────────────────────────────────────────────
function KpiHero() {
  const s = {
    hero:  { background: colors.white, borderBottom: `1px solid ${colors.gray200}`, padding: 8, flexShrink: 0 },
    title: { fontSize: 11, fontWeight: 700, color: colors.dark },
    grid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 6 },
    cell:  { background: colors.gray50, borderRadius: 7, padding: 6 },
    val:   { fontSize: 13, fontWeight: 700, color: colors.dark },
    lbl:   { fontSize: 7, color: colors.gray600, marginTop: 1 },
  };
  return (
    <div style={s.hero}>
      <div style={s.title}>Objectifs financiers</div>
      <div style={s.grid}>
        {KPI.map(({ value, label }) => (
          <div key={label} style={s.cell}>
            <div style={s.val}>{value}</div>
            <div style={s.lbl}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniChart() {
  const maxVal = Math.max(...CHART_DATA);
  const chartH = 58; // px

  const s = {
    box:   { background: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: 8, padding: 8, margin: '6px 8px' },
    title: { fontSize: 9, fontWeight: 600, color: colors.dark, marginBottom: 2 },
    bars:  { display: 'flex', alignItems: 'flex-end', gap: 2, height: chartH, margin: '6px 0 3px' },
    col:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
    lbl:   { fontSize: 6, color: colors.gray400 },
    foot:  { display: 'flex', justifyContent: 'space-between', fontSize: 7, color: colors.gray600 },
    strong:{ fontWeight: 700 },
  };

  return (
    <div style={s.box}>
      <div style={s.title}>Progression — Achat Voiture</div>
      <div style={s.bars}>
        {CHART_DATA.map((v, i) => (
          <div key={i} style={s.col}>
            <div style={{
              width: '100%',
              borderRadius: '2px 2px 0 0',
              minHeight: 3,
              height: Math.round((v / maxVal) * chartH),
              background: i < FILLED_BARS ? colors.primary : colors.gray200,
            }}/>
            <div style={s.lbl}>{MONTHS[i]}</div>
          </div>
        ))}
      </div>
      <div style={s.foot}>
        <span>Actuel: <strong style={s.strong}>52 000 MAD</strong></span>
        <span>Cible: <strong style={s.strong}>80 000 MAD</strong></span>
      </div>
    </div>
  );
}

function GoalItem({ goal, onDelete }) {
  const pct   = Math.min(100, Math.round((goal.current / goal.total) * 100));
  const done  = pct >= 100;

  const s = {
    item: {
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: 8, padding: 8,
      margin: '0 8px 5px',
      cursor: 'pointer',
      position: 'relative',
    },
    top:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    name: { fontSize: 10, fontWeight: 600, color: colors.dark },
    pctDelete: { display: 'flex', gap: 6, alignItems: 'center' },
    pct:  { fontSize: 10, fontWeight: 700, color: done ? colors.success : colors.primary },
    deleteBtn: {
      background: colors.danger || '#ef4444',
      color: colors.white,
      border: 'none',
      borderRadius: 4,
      padding: '2px 6px',
      fontSize: 12,
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'all 0.2s',
    },
    sub:  { fontSize: 8, color: colors.gray600, marginBottom: 4 },
    bar:  { height: 3, background: colors.gray100, borderRadius: 2, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 2, background: done ? colors.success : colors.primary, width: `${pct}%`, transition: 'width .4s' },
  };

  return (
    <div style={s.item}>
      <div style={s.top}>
        <div style={s.name}>{goal.name}</div>
        <div style={s.pctDelete}>
          <div style={s.pct}>{pct}%</div>
          <button style={s.deleteBtn} onClick={() => onDelete(goal.name)}>✕</button>
        </div>
      </div>
      <div style={s.sub}>{goal.current.toLocaleString()} / {goal.total.toLocaleString()} MAD — {goal.deadline}</div>
      <div style={s.bar}><div style={s.fill}/></div>
    </div>
  );
}

// ─── GoalFilter ─────────────────────────────────────────────────────────────
function GoalFilter({ selected, onSelect }) {
  const s = {
    container: { display: 'flex', gap: 6, padding: '8px', borderBottom: `1px solid ${colors.gray200}` },
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

  const filters = ['Tous', 'En cours', 'Achevé'];

  return (
    <div style={s.container}>
      {filters.map(filter => (
        <div
          key={filter}
          style={s.pill(selected === filter)}
          onClick={() => onSelect(filter)}
        >
          {filter}
        </div>
      ))}
    </div>
  );
}
/**
 * ObjectifsPage — gestion des objectifs financiers.
 */
export default function ObjectifsPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ titre: '', montant: '', dateFin: '' });
  const [goals, setGoals] = useState(GOALS);
  const [selectedFilter, setSelectedFilter] = useState('Tous');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

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

  const handleAddGoal = () => {
    if (!newGoal.titre || !newGoal.montant || !newGoal.dateFin) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const goalToAdd = {
      name: newGoal.titre,
      current: 0,
      total: parseInt(newGoal.montant),
      deadline: newGoal.dateFin,
    };

    setGoals([...goals, goalToAdd]);
    setNewGoal({ titre: '', montant: '', dateFin: '' });
    setShowNewGoalForm(false);
  };

  const handleDeleteGoal = (goalName) => {
    setGoalToDelete(goalName);
    setShowDeleteConfirm(true);
    setDeleteConfirmed(false);
  };

  const confirmDeleteGoal = () => {
    setDeleteConfirmed(true);
    setGoals(goals.filter(g => g.name !== goalToDelete));
    
    // Fermer après 1.5 secondes
    setTimeout(() => {
      setShowDeleteConfirm(false);
      setGoalToDelete(null);
    }, 1500);
  };

  // Filtrer les objectifs selon le filtre sélectionné
  const filteredGoals = goals.filter(goal => {
    const pct = Math.min(100, Math.round((goal.current / goal.total) * 100));
    const done = pct >= 100;

    if (selectedFilter === 'En cours') return !done;
    if (selectedFilter === 'Achevé') return done;
    return true; // 'Tous'
  });

  const s = {
    screen: { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' },
    scroll: { flex: 1, overflowY: 'auto' },
    listHd: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '2px 8px 5px',
    },
    listT:  { fontSize: 11, fontWeight: 700, color: colors.dark },
    newBtn: {
      fontSize: 8, fontWeight: 600,
      background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 6,
      padding: '4px 8px', cursor: 'pointer',
      transition: 'all 0.2s',
    },
    modalOverlay: {
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
    },
    modalHeader: { fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 20 },
    field: { marginBottom: 16 },
    label: { fontSize: 9, fontWeight: 600, color: colors.gray600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: {
      width: '100%', boxSizing: 'border-box',
      padding: '10px 12px',
      border: `1px solid ${colors.gray200}`, borderRadius: 8,
      fontSize: 11, color: colors.dark,
      fontFamily: 'inherit',
    },
    btnGroup: { display: 'flex', gap: 8, marginTop: 20 },
    btn: (primary) => ({
      flex: 1, padding: '11px',
      background: primary ? colors.primary : colors.gray100,
      color: primary ? colors.white : colors.dark,
      border: 'none', borderRadius: 8,
      fontSize: 11, fontWeight: 600,
      cursor: 'pointer',
      transition: 'all .2s',
    }),
  };

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
        <KpiHero />
        <MiniChart />

        <div style={s.listHd}>
          <div style={s.listT}>Mes objectifs</div>
          <button style={s.newBtn} onClick={() => setShowNewGoalForm(true)}>+ Nouveau</button>
        </div>

        <GoalFilter selected={selectedFilter} onSelect={setSelectedFilter} />

        {filteredGoals.map((g) => <GoalItem key={g.name} goal={g} onDelete={handleDeleteGoal} />)}
        <div style={{ height: 10 }}/>
      </div>

      {/* Modal pour ajouter un nouvel objectif */}
      {showNewGoalForm && (
        <div style={s.modalOverlay} onClick={() => setShowNewGoalForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>📌 Nouvel objectif</div>
            
            <div style={s.field}>
              <label style={s.label}>Titre de l'objectif *</label>
              <input
                style={s.input}
                type="text"
                placeholder="Ex: Achat d'une maison"
                value={newGoal.titre}
                onChange={(e) => setNewGoal({ ...newGoal, titre: e.target.value })}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Montant visé (MAD) *</label>
              <input
                style={s.input}
                type="number"
                placeholder="Ex: 50000"
                value={newGoal.montant}
                onChange={(e) => setNewGoal({ ...newGoal, montant: e.target.value })}
                min="0"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Date fin *</label>
              <input
                style={s.input}
                type="text"
                placeholder="Ex: Décembre 2026"
                value={newGoal.dateFin}
                onChange={(e) => setNewGoal({ ...newGoal, dateFin: e.target.value })}
              />
            </div>

            <div style={s.btnGroup}>
              <button style={s.btn(false)} onClick={() => setShowNewGoalForm(false)}>Annuler</button>
              <button style={s.btn(true)} onClick={handleAddGoal}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div style={deleteConfirmStyles.overlay} onClick={() => !deleteConfirmed && setShowDeleteConfirm(false)}>
          <div style={deleteConfirmStyles.modal} onClick={(e) => e.stopPropagation()}>
            {!deleteConfirmed ? (
              <>
                <div style={deleteConfirmStyles.dangerBox}>
                  <div style={deleteConfirmStyles.dangerIcon}>⚠️</div>
                  <div style={deleteConfirmStyles.dangerText}>Supprimer cet objectif?</div>
                </div>
                
                <div style={{ fontSize: 9, color: colors.gray600, marginBottom: 16, textAlign: 'center', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, color: colors.dangerDark, marginBottom: 4 }}>{goalToDelete}</div>
                  Cette action ne peut pas être annulée.
                </div>

                <div style={deleteConfirmStyles.btnGroup}>
                  <button style={deleteConfirmStyles.btn(false)} onClick={() => setShowDeleteConfirm(false)}>
                    Annuler
                  </button>
                  <button style={deleteConfirmStyles.btn(true)} onClick={confirmDeleteGoal}>
                    Supprimer
                  </button>
                </div>
              </>
            ) : (
              <div style={deleteConfirmStyles.successBox}>
                <div style={deleteConfirmStyles.successIcon}>✓</div>
                <div style={deleteConfirmStyles.successText}>Objectif supprimé!</div>
                <div style={deleteConfirmStyles.successSubtext}>
                  L'objectif a été supprimé avec succès
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatbotWidget />      <BottomNav activePage="objectifs" onNavigate={handleNavigate} />
    </div>
  );
}
