import React from 'react';
import { X, Shield, Send, Info, ExternalLink, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import './SetupGuide.css';

interface SetupGuideProps {
    onClose: () => void;
}

const SetupGuide: React.FC<SetupGuideProps> = ({ onClose }) => {
    return (
        <motion.div
            className="guide-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="guide-modal"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
            >
                <div className="guide-header">
                    <div className="guide-title">
                        <Info size={24} className="accent-icon" />
                        <h2>Setup Guide & About</h2>
                    </div>
                    <button className="close-guide" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="guide-tabs">
                    <div className="guide-content">
                        <section className="about-section">
                            <h3>About TeleGphoto</h3>
                            <p>
                                TeleGphoto is an open-source, private cloud storage solution built on top of the Telegram Bot API.
                                It allows you to use Telegram's unlimited storage as your personal photo gallery.
                            </p>
                            <div className="feature-grid">
                                <div className="feature-item">
                                    <Shield size={20} />
                                    <span>Private & Secure</span>
                                </div>
                                <div className="feature-item">
                                    <Send size={20} />
                                    <span>Unlimited Storage</span>
                                </div>
                                <div className="feature-item">
                                    <Heart size={20} />
                                    <span>Free Forever</span>
                                </div>
                            </div>
                        </section>

                        <div className="divider"></div>

                        <h3>Step-by-Step Setup</h3>

                        <section className="step-card">
                            <div className="step-num">1</div>
                            <div className="step-info">
                                <h3>Create your Robot Helper (Bot Token)</h3>
                                <p>Your bot is the messenger that uploads files to Telegram.</p>
                                <div className="instruction-box">
                                    <p>1. Open Telegram and search for <b>@BotFather</b></p>
                                    <p>2. Tap <b>Start</b></p>
                                    <p>3. Type: <code>/newbot</code></p>
                                    <p>4. Enter a name and a username ending in <code>bot</code> (e.g., <code>MagicBackpack_bot</code>)</p>
                                    <div className="code-example">
                                        <span className="label">Copy your Token:</span>
                                        <code>123456789:AAExampleBotToken</code>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="step-card">
                            <div className="step-num">2</div>
                            <div className="step-info">
                                <h3>Create your Secret Vault (Private Channel)</h3>
                                <p>This channel will act as your personal cloud storage.</p>
                                <div className="instruction-box">
                                    <p>1. Open Telegram → <b>New Channel</b></p>
                                    <p>2. Choose <b>Private Channel</b></p>
                                    <p>3. Give it a name (e.g., <code>My Secret Vault</code>)</p>
                                </div>
                            </div>
                        </section>

                        <section className="step-card">
                            <div className="step-num">3</div>
                            <div className="step-info">
                                <h3>Add the Bot to Your Vault</h3>
                                <div className="instruction-box">
                                    <p>1. Open the channel Info → <b>Administrators</b></p>
                                    <p>2. Tap <b>Add Admin</b></p>
                                    <p>3. Search your bot and add it with <b>Post Messages</b> permission</p>
                                </div>
                            </div>
                        </section>

                        <section className="step-card">
                            <div className="step-num">4</div>
                            <div className="step-info">
                                <h3>Get Your Chat ID (Vault Address)</h3>
                                <div className="instruction-box">
                                    <p>1. Send any message like <code>hello</code> in the channel.</p>
                                    <p>2. Open this link (replace &lt;TOKEN&gt; with yours):</p>
                                    <code className="url-link">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>
                                    <p>3. Find the "id" value in the response:</p>
                                    <div className="code-json">
                                        <code>{`"chat": { "id": -1001234567890, ... }`}</code>
                                    </div>
                                    <p className="tip">👉 The "id" (including the minus sign) is your Chat ID.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="guide-footer">
                    <p>Build with ❤️ by Krishna Kumar</p>
                    <a href="https://github.com/krishna3163/GooglePhoto_Alternative" target="_blank" rel="noreferrer">
                        View on GitHub <ExternalLink size={14} />
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SetupGuide;
