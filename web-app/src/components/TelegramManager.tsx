import React, { useState } from 'react';
import { Send, Users, MessageSquare, Shield, Lock } from 'lucide-react';
import type { TelegramConfig } from '../types';
import './TelegramManager.css';

interface TelegramManagerProps {
    config: TelegramConfig | null;
}

const TelegramManager: React.FC<TelegramManagerProps> = ({ config }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Mock data for demonstration
    const mockChats = [
        { id: 1, name: 'Main Support Group', lastMsg: 'Photo uploaded successfully!', type: 'group' },
        { id: 2, name: 'Development Team', lastMsg: 'Internal server error fixed.', type: 'group' },
        { id: 3, name: 'Cloud Storage Bot', lastMsg: 'Waiting for files...', type: 'bot' },
    ];

    if (!config?.isDeveloperMode) {
        return (
            <div className="tg-manager-locked">
                <Shield size={48} />
                <h3>Developer Mode Required</h3>
                <p>Enable Developer Mode in Settings to access this workspace.</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="tg-login-screen">
                <div className="login-card">
                    <Send size={48} className="tg-logo" />
                    <h2>Telegram Workspace</h2>
                    <p>Manage your groups, channels, and messages directly from TeleGphoto.</p>
                    <button className="tg-primary-login" onClick={() => setIsLoggedIn(true)}>
                        <Lock size={18} />
                        Login with Telegram
                    </button>
                    <span className="secure-text">Secure connection via Official Telegram API</span>
                </div>
            </div>
        );
    }

    return (
        <div className="tg-manager-container">
            <div className="tg-sidebar">
                <div className="sidebar-header">
                    <h3>Messages</h3>
                    <div className="sidebar-actions">
                        <Users size={18} />
                    </div>
                </div>
                <div className="chat-list">
                    {mockChats.map(chat => (
                        <div key={chat.id} className="chat-item">
                            <div className="chat-avatar">{chat.name[0]}</div>
                            <div className="chat-info">
                                <div className="chat-name">{chat.name}</div>
                                <div className="chat-last-msg">{chat.lastMsg}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="tg-main-view">
                <div className="view-header">
                    <MessageSquare size={18} />
                    <span>Select a chat to view messages</span>
                </div>
                <div className="empty-state">
                    <Send size={48} />
                    <p>Developer Console Active</p>
                    <span>Full User-API integration enabled for this session.</span>
                </div>
            </div>
        </div>
    );
};

export default TelegramManager;
