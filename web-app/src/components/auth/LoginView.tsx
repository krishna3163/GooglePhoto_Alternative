import React, { useState } from 'react';
import { Lock, User, Shield, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { unlockVaultWithPassword } from '../../services/cryptoService';
import './LoginView.css';

interface LoginViewProps {
  onSuccess: (userData: any, masterVaultKey: CryptoKey, vaults: any[]) => void;
  onSwitchToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim() || !password) {
      setError('Please enter your username/email and password');
      return;
    }

    setLoading(true);
    try {
      const authData = await authApi.login({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      });

      // Unlock default vault key using the user password and salt
      let masterKey: CryptoKey | null = null;
      const defaultVault = authData.vaults?.[0];

      if (defaultVault?.encryptedVaultKey && defaultVault.salt) {
        try {
          masterKey = await unlockVaultWithPassword(password, {
            wrappedVaultKey: defaultVault.encryptedVaultKey,
            wrappedWithRecovery: defaultVault.wrappedWithRecovery || '',
            recoveryKey: '',
            salt: defaultVault.salt,
            v: defaultVault.keyVersion || 1,
          });
        } catch (keyErr: any) {
          console.warn('Vault key unwrap note:', keyErr);
        }
      }


      onSuccess(authData.user, masterKey as any, authData.vaults || []);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Authentication failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view-page">
      <div className="login-view-card">
        {/* Brand Header */}
        <div className="login-brand-group">
          <div className="login-logo-circle">
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" stroke="#FFC928" strokeWidth="2" fill="none" opacity="0.9" />
              <circle cx="16" cy="16" r="9" stroke="#FFC928" strokeWidth="1.5" fill="rgba(255,201,40,0.1)" />
              <circle cx="16" cy="16" r="4" fill="#FFC928" />
              <circle cx="12" cy="12" r="2" fill="#FFC928" opacity="0.4" />
              <rect x="10" y="3" width="12" height="4" rx="2" fill="#FFC928" opacity="0.7" />
            </svg>
          </div>
          <h1 className="login-app-title">TeleGphoto</h1>
          <p className="login-app-subtitle">Your Private, Cross-Device Media Cloud</p>
        </div>

        {/* Security Tag */}
        <div className="login-security-badge">
          <Shield size={14} color="#FFC928" />
          <span>Zero-Knowledge • End-to-End Encrypted</span>
        </div>

        {error && (
          <div className="login-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label>Username or Email</label>
            <div className="login-field-box">
              <User size={18} className="field-icon" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter your username or email"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-input-group">
            <label>Password</label>
            <div className="login-field-box">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading-spinner" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer-switch">
          <span>Don't have an account?</span>
          <button type="button" onClick={onSwitchToRegister} className="login-register-link">
            <Sparkles size={14} /> Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
