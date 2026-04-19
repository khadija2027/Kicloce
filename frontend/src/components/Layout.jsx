import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPathFromLocation = (path) => {
    if (path.includes('search')) return 'search';
    if (path.includes('goals')) return 'goals';
    if (path.includes('messages')) return 'messages';
    if (path.includes('education')) return 'education';
    return 'home';
  };

  const activeTab = getPathFromLocation(location.pathname);

  const tabs = [
    { id: 'home', label: 'Accueil', path: '/dashboard', icon: <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/></> },
    { id: 'search', label: 'Recherche', path: '/search', icon: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></> },
    { id: 'goals', label: 'Objectifs', path: '/goals', icon: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="#9CA3AF"/></> },
    { id: 'messages', label: 'Messages', path: '/messages', icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>, badge: 3 },
    { id: 'education', label: 'Formation', path: '/education', icon: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round"/></> },
  ];

  return (
    <div className="bnav">
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          className={`bn-tab ${activeTab === tab.id ? 'act' : ''}`}
          onClick={() => navigate(tab.path)}
          style={{ cursor: 'pointer' }}
        >
          {activeTab === tab.id && <div className="bn-dot"></div>}
          {tab.badge && <div className="bn-badge">{tab.badge}</div>}
          <svg className="bn-icon" viewBox="0 0 24 24" fill="none" stroke={activeTab === tab.id ? "#1A56DB" : "#9CA3AF"} strokeWidth="2">
            {tab.icon}
          </svg>
          <div className="bn-lbl" style={{ color: activeTab === tab.id ? '#1A56DB' : '' }}>{tab.label}</div>
        </div>
      ))}
    </div>
  );
};

const TopBar = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="tb">
      <div className="tb-logo">Ton<span>tine+</span></div>
      <div className="tb-right">
        <div className="tb-icon">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="tb-av">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '420px', margin: '0 auto', background: '#F5F7FA', border: '1px solid #e2e8f0' }}>
    <TopBar />
    <div className="scroll">
      {children}
    </div>
    <BottomNav />
  </div>
);

export default Layout;
