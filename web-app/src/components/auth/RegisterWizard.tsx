import React, { useState } from 'react';
import { Lock, User, Mail, Send, CheckCircle, Copy, ArrowRight, Key, Sparkles, AlertTriangle } from 'lucide-react';
import { authApi } from '../../api/authApi';

import { telegramApi } from '../../api/telegramApi';
import { initializeVault } from '../../services/cryptoService';
import './RegisterWizard.css';

interface RegisterWizardProps {
  onSuccess: (userData: any, masterVaultKey: CryptoKey, vaults: any[]) => void;
  onSwitchToLogin: () => void;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Telegram
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');

  // Step 3: Recovery Key
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [acknowledgedKey, setAcknowledgedKey] = useState(false);

  // Temporary in-memory registration context
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [registeredVaults, setRegisteredVaults] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Step 1: Account Creation + Vault Envelope Key Generation
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // Initialize zero-knowledge envelope encryption bundle
      const { bundle, masterKey: derivedKey } = await initializeVault(password);
      setMasterKey(derivedKey);
      setRecoveryKey(bundle.recoveryKey);

      // Register on backend with initial wrapped vault key
      const authData = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        initialVault: {
          name: 'Personal Vault',
          encryptedVaultKey: bundle.wrappedVaultKey,
          wrappedWithRecovery: bundle.wrappedWithRecovery,
          salt: bundle.salt,
          keyVersion: bundle.v,
        },
      });

      setRegisteredUser(authData.user);
      setRegisteredVaults([authData.defaultVault]);
      setStep(2);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Connect Telegram Storage
  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!botToken.trim() || !chatId.trim()) {
      setError('Please provide both Bot Token and Chat ID');
      return;
    }

    setLoading(true);
    try {
      await telegramApi.connect({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
      });

      setStep(3);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to connect to Telegram. Please check credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Skip Telegram setup for demo / sandbox
  const handleSkipTelegram = () => {
    setStep(3);
  };

  // Handle Step 3: Complete Setup after acknowledging recovery key
  const handleFinish = () => {
    if (!acknowledgedKey) {
      setError('Please confirm that you have safely saved your Emergency Recovery Key.');
      return;
    }
    if (registeredUser && masterKey) {
      onSuccess(registeredUser, masterKey, registeredVaults);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  return (
    <div className="register-wizard-page">
      <div className="register-wizard-card">
        {/* Wizard Header Progress */}
        <div className="wizard-progress-header">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {error && (
          <div className="wizard-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Account Creation */}
        {step === 1 && (
          <>
            <div className="wizard-title-group">
              <h2>Create Your TeleGphoto Account</h2>
              <p>Sign up to access your encrypted media vault across all your devices.</p>
            </div>

            <form onSubmit={handleAccountSubmit} className="wizard-form">
              <div className="wizard-input-group">
                <label>Username</label>
                <div className="wizard-field-box">
                  <User size={18} className="field-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. krishna_cloud"
                    required
                  />
                </div>
              </div>

              <div className="wizard-input-group">
                <label>Email Address</label>
                <div className="wizard-field-box">
                  <Mail size={18} className="field-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="wizard-input-group">
                <label>Master Password</label>
                <div className="wizard-field-box">
                  <Lock size={18} className="field-icon" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
              </div>

              <div className="wizard-input-group">
                <label>Confirm Password</label>
                <div className="wizard-field-box">
                  <Lock size={18} className="field-icon" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="wizard-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading-spinner" />
                ) : (
                  <>
                    <span>Next: Connect Storage</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="wizard-footer-switch">
              <span>Already have an account?</span>
              <button type="button" onClick={onSwitchToLogin} className="wizard-login-link">
                Sign In
              </button>
            </div>
          </>
        )}

        {/* STEP 2: Connect Telegram Storage */}
        {step === 2 && (
          <>
            <div className="wizard-title-group">
              <div className="wizard-step-badge">
                <Send size={16} color="#FFC928" />
                <span>Step 2 of 3: Connect Media Cloud</span>
              </div>
              <h2>Connect Telegram Storage</h2>
              <p>
                Connect your Telegram Bot once. Your credentials stay securely on the backend; all media is encrypted before upload.
              </p>
            </div>

            <form onSubmit={handleTelegramSubmit} className="wizard-form">
              <div className="wizard-input-group">
                <label>Telegram Bot Token</label>
                <div className="wizard-field-box">
                  <Key size={18} className="field-icon" />
                  <input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="e.g. 6277804062:AAHbq8..."
                    required
                  />
                </div>
              </div>

              <div className="wizard-input-group">
                <label>Telegram Channel or Chat ID</label>
                <div className="wizard-field-box">
                  <Send size={18} className="field-icon" />
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="e.g. -1001234567890"
                    required
                  />
                </div>
              </div>

              <div className="wizard-action-row">
                <button type="button" onClick={handleSkipTelegram} className="wizard-secondary-btn">
                  Set Up Later
                </button>
                <button type="submit" className="wizard-submit-btn flex-1" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading-spinner" />
                  ) : (
                    <>
                      <span>Connect Storage</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 3: Recovery Key Display */}
        {step === 3 && (
          <>
            <div className="wizard-title-group">
              <div className="wizard-step-badge success">
                <CheckCircle size={16} color="#3DDC97" />
                <span>Vault Encryption Initialized</span>
              </div>
              <h2>Your Emergency Recovery Key</h2>
              <p>
                Because TeleGphoto uses zero-knowledge client encryption, if you ever lose your password, this offline key is the <b>only way</b> to recover your private vault.
              </p>
            </div>

            <div className="recovery-key-card">
              <div className="recovery-key-header">
                <Key size={16} color="#FFC928" />
                <span>OFFLINE RECOVERY PHRASE (64-HEX)</span>
              </div>
              <div className="recovery-key-code">{recoveryKey}</div>
              <button type="button" onClick={copyToClipboard} className="copy-key-btn">
                {copiedKey ? <CheckCircle size={16} color="#3DDC97" /> : <Copy size={16} />}
                <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy Recovery Key'}</span>
              </button>
            </div>

            <label className="recovery-ack-checkbox">
              <input
                type="checkbox"
                checked={acknowledgedKey}
                onChange={(e) => setAcknowledgedKey(e.target.checked)}
              />
              <span>I have copied and safely stored my recovery key in a password manager or secure location.</span>
            </label>

            <button
              type="button"
              onClick={handleFinish}
              className="wizard-submit-btn"
              disabled={!acknowledgedKey}
            >
              <Sparkles size={18} />
              <span>Enter My TeleGphoto Vault</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterWizard;
