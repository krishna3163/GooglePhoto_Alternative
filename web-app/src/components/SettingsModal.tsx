import React, { useState } from 'react';
import type { TelegramConfig } from '../types';
import { HelpCircle, Shield, Key } from 'lucide-react';
import './SettingsModal.css';

interface SettingsModalProps {
    config: TelegramConfig | null;
    onSave: (config: TelegramConfig) => void;
    onClose: () => void;
    onHelpClick?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose, onHelpClick }) => {
    const [token, setToken] = useState(config?.token || '');
    const [chatId, setChatId] = useState(config?.chatId || '');
    const [isDeveloperMode, setIsDeveloperMode] = useState(config?.isDeveloperMode || false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ token, chatId, isDeveloperMode });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Telegram Configuration</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="settings-form">
                    <p className="helper-text">
                        Connect your Telegram Channel to use TeleGphoto as your private cloud.
                    </p>
                    <div className="form-group">
                        <label htmlFor="token">Bot Token</label>
                        <input
                            type="password"
                            id="token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="e.g. 123456:ABC-DEF1234..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="chatId">Chat ID</label>
                        <input
                            type="text"
                            id="chatId"
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                            placeholder="e.g. -100123456789"
                            required
                        />
                    </div>

                    <div className="developer-section">
                        <div className="dev-mode-row">
                            <div className="dev-mode-label">
                                <Shield size={18} className="dev-icon" />
                                <span>Developer Mode</span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={isDeveloperMode}
                                    onChange={(e) => setIsDeveloperMode(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        {isDeveloperMode && (
                            <div className="telegram-login-wrapper">
                                <p className="dev-helper-text">Enhanced features enabled. Authenticate to manage messages directly.</p>
                                <button type="button" className="tg-login-btn">
                                    <Key size={18} />
                                    <span>Login with Telegram</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="modal-help-link" onClick={onHelpClick}>
                        <HelpCircle size={16} />
                        <span>Need help finding these? View Setup Guide</span>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn">Save Settings</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
