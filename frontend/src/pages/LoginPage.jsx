import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { authService } from '../services/api';
import api from '../services/api';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '123456',
    firstName: '',
    lastName: '',
    email: '',
    phoneOperator: 'IAM',
    placeOfBirth: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    legalType: '',
    identificationNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();
  const { setUser, setError } = useAuthStore();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('🔐 Login attempt with phone:', formData.phoneNumber);
      const { phoneNumber, password } = formData;
      const response = await authService.login({ phoneNumber, password });
      console.log('✅ Login successful:', response.data);
      setUser(response.data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Login error:', error);
      console.log('Error response:', error.response?.data);
      const availableUsers = error.response?.data?.availableUsers;
      let errorMsg = error.response?.data?.error || 'Login failed';
      
      if (availableUsers && availableUsers.length > 0) {
        const usersList = availableUsers.map(u => `${u.name} (${u.phone})`).join('\n');
        errorMsg = `${errorMsg}\n\nUtilisateurs disponibles:\n${usersList}`;
      }
      
      setError(errorMsg);
      alert(`Login Error: ${errorMsg}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.register(formData);
      console.log('Registration successful, OTP sent:', response.data);
      setShowOtp(true);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      alert(`Registration Error: ${errorMsg}`);
      console.error('Registration error:', error);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.verifyOtp(formData.phoneNumber, otp);
      
      // After OTP verification, log in to get the token
      const loginResponse = await authService.login({ 
        phoneNumber: formData.phoneNumber, 
        password: formData.password
      });
      
      const { user, token } = loginResponse.data;

      // Set token for all future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user in global state
      setUser(user);

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'OTP verification failed';
      setError(errorMsg);
      alert(`OTP Error: ${errorMsg}`);
      console.error('OTP error:', error);
    }
  };

  if (showOtp) {
    return (
      <div className="auth-container">
        <div className="auth-s">
          <div className="auth-logo-s">Ton<span>tine+</span></div>
          <div className="auth-tag-s">Vérification OTP</div>
          <form onSubmit={handleOtpSubmit}>
            <div className="fg">
              <label className="flbl">Code OTP</label>
              <input 
                className="finput" 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="Entrez le code à 6 chiffres"
              />
            </div>
            <button className="btn-auth" type="submit">Vérifier & Activer</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-s">
        <div className="auth-logo-s">Ton<span>tine+</span></div>
        <div className="auth-tag-s">Votre cercle d'épargne solidaire digital</div>
        <div className="auth-tabs-s">
          <button className={`auth-tab-s ${isLogin ? 'act' : ''}`} onClick={() => setIsLogin(true)}>Connexion</button>
          <button className={`auth-tab-s ${!isLogin ? 'act' : ''}`} onClick={() => setIsLogin(false)}>Créer un compte</button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="fg">
              <label className="flbl">Numéro de téléphone</label>
              <input className="finput" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} />
            </div>
            <div className="fg">
              <label className="flbl">Mot de passe</label>
              <input className="finput" name="password" type="password" value={formData.password || ''} onChange={handleInputChange} />
            </div>
            <button className="btn-auth" type="submit">Se connecter</button>
            
            {/* Test Users Info */}
            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>👤 Utilisateurs de test:</div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Fatima El Amrani</strong><br/>
                📱 212700446631<br/>
                🔐 Tout mot de passe
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Youssef Bennani</strong><br/>
                📱 212612345678<br/>
                🔐 Tout mot de passe
              </div>
              <div>
                <strong>Nadia Aziz</strong><br/>
                📱 212722334455<br/>
                🔐 Tout mot de passe
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="frow-s">
              <div className="fg"><label className="flbl">Prénom</label><input className="finput" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} /></div>
              <div className="fg"><label className="flbl">Nom</label><input className="finput" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="fg"><label className="flbl">Email</label><input className="finput" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} /></div>
            <div className="frow-s">
              <div className="fg"><label className="flbl">Téléphone</label><input className="finput" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} /></div>
              <div className="fg"><label className="flbl">Opérateur</label><input className="finput" name="phoneOperator" value={formData.phoneOperator || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="frow-s">
              <div className="fg"><label className="flbl">Date de naissance</label><input className="finput" name="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handleInputChange} /></div>
              <div className="fg"><label className="flbl">Lieu de naissance</label><input className="finput" name="placeOfBirth" value={formData.placeOfBirth || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="fg"><label className="flbl">Adresse</label><input className="finput" name="address" value={formData.address || ''} onChange={handleInputChange} /></div>
            <div className="frow-s">
              <div className="fg"><label className="flbl">Genre</label><input className="finput" name="gender" value={formData.gender || ''} onChange={handleInputChange} /></div>
              <div className="fg"><label className="flbl">Type ID</label><input className="finput" name="legalType" value={formData.legalType || ''} onChange={handleInputChange} /></div>
            </div>
            <div className="fg"><label className="flbl">Numéro ID</label><input className="finput" name="identificationNumber" value={formData.identificationNumber || ''} onChange={handleInputChange} /></div>
            <div className="fg"><label className="flbl">Mot de passe</label><input className="finput" name="password" type="password" value={formData.password || ''} onChange={handleInputChange} /></div>
            <button className="btn-auth" type="submit">Créer un compte</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
