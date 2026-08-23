import React, { useState } from 'react';
import { Shield, Key, Send, HelpCircle, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';
import { getBotInfo } from '../../services/telegramService';
import type { TelegramConfig } from '../../types';
import './AuthWelcomeView.css';

interface AuthWelcomeViewProps {
    onLogin: (config: TelegramConfig) => void;
}

export const AuthWelcomeView: React.FC<AuthWelcomeViewProps> = ({ onLogin }) => {
    const [token, setToken] = useState('');
    const [chatId, setChatId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token.trim()) {
            setError('Please enter your Telegram Bot Token');
            return;
        }
        if (!chatId.trim()) {
            setError('Please enter your Telegram Chat ID');
            return;
        }

        setLoading(true);
        try {
            // Validate bot token with Telegram API
            let resolvedName = displayName.trim();
            try {
                const info = await getBotInfo(token.trim());
                if (!resolvedName) {
                    resolvedName = info.first_name || info.username || 'TeleGphoto User';
                }
            } catch (validationErr: any) {
                console.warn('Bot token validation notice:', validationErr?.message || validationErr);
                if (!resolvedName) {
                    resolvedName = 'TeleGphoto User';
                }
            }

            const newConfig: TelegramConfig = {
                token: token.trim(),
                chatId: chatId.trim(),
                isDeveloperMode: false,
                storageModel: 'model1',
            };

            if (resolvedName) {
                localStorage.setItem('user_name', resolvedName);
            }

            onLogin(newConfig);
        } catch (err: any) {
            setError(err?.message || 'Failed to connect to Telegram. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        const demoConfig: TelegramConfig = {
            token: 'demo_bot_token_mock',
            chatId: '1253687962',
            isDeveloperMode: true,
            storageModel: 'model1',
        };
        localStorage.setItem('user_name', 'Demo User');
        onLogin(demoConfig);
    };

    return (
        <div className="auth-welcome-page">
            <div className="auth-welcome-card">
                {/* Brand Header */}
                <div className="auth-brand-group">
                    <div className="auth-logo-circle">
                        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" stroke="#FFC928" strokeWidth="2" fill="none" opacity="0.9" />
                            <circle cx="16" cy="16" r="9" stroke="#FFC928" strokeWidth="1.5" fill="rgba(255,201,40,0.1)" />
                            <circle cx="16" cy="16" r="4" fill="#FFC928" />
                            <circle cx="12" cy="12" r="2" fill="#FFC928" opacity="0.4" />
                            <rect x="10" y="3" width="12" height="4" rx="2" fill="#FFC928" opacity="0.7" />
                        </svg>
                    </div>
                    <h1 className="auth-app-title">TeleGphoto</h1>
                    <p className="auth-app-subtitle">Your Private, Zero-Knowledge Media Cloud</p>
                </div>

                {/* Privacy Badge */}
                <div className="auth-security-pill">
                    <Shield size={14} color="#FFC928" />
                    <span>Client-side AES-256-GCM encrypted. Zero knowledge.</span>
                </div>

                {/* Login Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error-banner">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="auth-field-group">
                        <label htmlFor="bot-token" className="auth-label">
                            <Key size={14} color="#FFC928" />
                            <span>Telegram Bot Token</span>
                        </label>
                        <input
                            id="bot-token"
                            type="password"
                            className="auth-text-input"
                            placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="auth-field-group">
                        <label htmlFor="chat-id" className="auth-label">
                            <Send size={14} color="#FFC928" />
                            <span>Telegram Chat ID</span>
                        </label>
                        <input
                            id="chat-id"
                            type="text"
                            className="auth-text-input"
                            placeholder="e.g. 1253687962 or @yourchannel"
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="auth-field-group">
                        <label htmlFor="display-name" className="auth-label">
                            <Sparkles size={14} color="#FFC928" />
                            <span>Your Name (Optional)</span>
                        </label>
                        <input
                            id="display-name"
                            type="text"
                            className="auth-text-input"
                            placeholder="e.g. Krishna"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? (
                            <span>Connecting to Vault...</span>
                        ) : (
                            <>
                                <span>Connect & Open Vault</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Quick Actions */}
                <div className="auth-secondary-actions">
                    <button type="button" className="auth-demo-btn" onClick={handleDemoLogin}>
                        <span>Explore with Demo Mode</span>
                    </button>

                    <button
                        type="button"
                        className="auth-help-toggle-btn"
                        onClick={() => setShowHelp(!showHelp)}
                    >
                        <HelpCircle size={14} />
                        <span>How do I get my Bot Token & Chat ID?</span>
                        {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>

                {/* Help Accordion */}
                {showHelp && (
                    <div className="auth-help-content">
                        <h4>30-Second Setup Guide:</h4>
                        <ol>
                            <li>
                                Open Telegram and search for <b>@BotFather</b>.
                            </li>
                            <li>
                                Send <code>/newbot</code> and follow prompts to create your bot. Copy the generated <b>API Token</b>.
                            </li>
                            <li>
                                Search for <b>@userinfobot</b> on Telegram, press Start, and copy your <b>Id</b> (Chat ID).
                            </li>
                            <li>
                                Send a quick <code>/start</code> message to your newly created bot so it can message you.
                            </li>
                            <li>Paste the Token and Chat ID above and click Connect!</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthWelcomeView;
