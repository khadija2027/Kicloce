import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, isAuthenticated: false, error: null }),
  
  // Update user wallet balance
  updateWalletBalance: (amount) => set((state) => {
    if (!state.user) return state;
    return {
      user: {
        ...state.user,
        walletBalance: (state.user.walletBalance || 0) + amount,
        walletData: {
          ...state.user.walletData,
          balance: (state.user.walletData?.balance || 0) + amount
        }
      }
    };
  }),
  
  // Update entire user data
  updateUser: (updates) => set((state) => {
    if (!state.user) return state;
    return {
      user: {
        ...state.user,
        ...updates
      }
    };
  })
}));

export const useTontineStore = create((set, get) => ({
  tontines: [],
  selectedTontine: null,
  isLoading: false,
  error: null,

  setTontines: (tontines) => set({ tontines }),
  setSelectedTontine: (tontine) => set({ selectedTontine: tontine }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addTontine: (tontine) => set((state) => ({
    tontines: [...state.tontines, tontine]
  })),

  updateTontine: (updatedTontine) => set((state) => ({
    tontines: state.tontines.map(t => t.id === updatedTontine.id ? updatedTontine : t),
    selectedTontine: state.selectedTontine?.id === updatedTontine.id ? updatedTontine : state.selectedTontine
  }))
}));

export const useWalletStore = create((set) => ({
  balance: 0,
  transactions: [],
  score: 0,

  setBalance: (balance) => set({ balance }),
  setTransactions: (transactions) => set({ transactions }),
  setScore: (score) => set({ score }),

  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  }))
}));

export const useAdminStore = create((set) => ({
  users: [],
  stats: {
    totalUsers: 0,
    activeTontines: 0,
    totalTransactions: 0,
    totalVolume: 0,
    averageScore: 0
  },
  apiMetrics: {
    requests: [],
    totalRequests: 0,
    endpoints: {}
  },
  isLoading: false,
  error: null,

  setUsers: (users) => set({ users }),
  setStats: (stats) => set({ stats }),
  setApiMetrics: (apiMetrics) => set({ apiMetrics }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addApiRequest: (request) => set((state) => ({
    apiMetrics: {
      ...state.apiMetrics,
      requests: [request, ...state.apiMetrics.requests].slice(0, 100),
      totalRequests: state.apiMetrics.totalRequests + 1,
      endpoints: {
        ...state.apiMetrics.endpoints,
        [request.endpoint]: (state.apiMetrics.endpoints[request.endpoint] || 0) + 1
      }
    }
  }))
}));
