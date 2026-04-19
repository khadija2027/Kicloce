import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Wallet, TrendingUp, Users } from 'lucide-react';
import { useAuthStore, useWalletStore } from '../context/store';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { balance, score } = useWalletStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Tontine Digitale" className="h-10 w-auto" />
          </Link>

          {/* Center - Quick Stats */}
          <div className="hidden md:flex space-x-8">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <div>
                <p className="text-xs text-blue-200">Solde</p>
                <p className="text-sm font-bold">{balance.toFixed(0)} MAD</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <div>
                <p className="text-xs text-blue-200">Score</p>
                <p className="text-sm font-bold">{score.toFixed(1)}/100</p>
              </div>
            </div>
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Admin Link */}
            {(user?.id === 'admin' || user?.firstName === 'Admin') && (
              <Link
                to="/admin"
                className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg font-semibold transition hidden sm:block"
              >
                🛡️ Admin
              </Link>
            )}
            
            <div className="hidden sm:block text-sm">
              <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-blue-200 text-xs">{user?.phoneNumber}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
