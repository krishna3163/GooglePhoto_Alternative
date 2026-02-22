import React, { useEffect } from 'react';
import { X, Github, Linkedin, Mail, ExternalLink, Award, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import './DeveloperProfile.css';

interface DeveloperProfileProps {
    onClose: () => void;
}

declare global {
    interface Window {
        formbutton?: (action: string, config: any) => void;
    }
}

const DeveloperProfile: React.FC<DeveloperProfileProps> = ({ onClose }) => {
    useEffect(() => {
        // Initialize formbutton widget
        if (window.formbutton) {
            window.formbutton('create', {
                action: 'https://formspree.io/f/xeelrpdd',
                title: 'Report Issues / Bugs',
                fields: [
                    {
                        type: 'email',
                        label: 'Email:',
                        name: 'email',
                        required: true,
                        placeholder: 'your@email.com'
                    },
                    {
                        type: 'textarea',
                        label: 'Message:',
                        name: 'message',
                        placeholder: 'Describe the issue or bug...',
                        required: true
                    },
                    { type: 'submit' }
                ],
                styles: {
                    title: {
                        backgroundColor: '#8ab4f8',
                        color: '#1a1c1e',
                        fontSize: '18px'
                    },
                    button: {
                        backgroundColor: '#8ab4f8',
                        color: '#1a1c1e',
                        fontSize: '14px'
                    },
                    field: {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px'
                    }
                }
            });
        }
    }, []);
    return (
        <motion.div
            className="dev-profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="dev-profile-modal"
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
            >
                <div className="dev-header">
                    <button className="close-dev" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="dev-profile-content">
                    <div className="dev-main-info">
                        <div className="dev-image-container always-animate">
                            <img src="/developer.gif" alt="Krishna Kumar" className="dev-photo" onError={(e) => { e.currentTarget.src = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGJrdW9qbm9qbm9qbm9qbm9qbm9qbm9qbm9qbm9qbm9qbm9qbm9qJmVwPXYxX2dpZnNfc2VhcmNoJnJpZD1naXBoeS5naWYmY3Q9Zw/L1R1QHdH097W5RNoS4/giphy.gif'; }} />
                            <div className="dev-badge">🇮🇳</div>
                        </div>
                        <h1 className="dev-name">
                            Krishna Kumar
                            <img src="https://flagcdn.com/w40/in.png" alt="India" className="inline-flag" style={{ width: '24px', marginLeft: '10px', verticalAlign: 'middle' }} />
                        </h1>
                        <p className="dev-tagline">Software Developer — Problem Solver — Open Source Contributor</p>

                        <div className="dev-social-pills">
                            <a href="https://github.com/krishna3163" target="_blank" rel="noreferrer" className="social-pill">
                                <Github size={18} /> GitHub
                            </a>
                            <a href="https://linkedin.com/in/krishna-kumar" target="_blank" rel="noreferrer" className="social-pill">
                                <Linkedin size={18} /> LinkedIn
                            </a>
                            <a href="mailto:kk3163019@gmail.com" className="social-pill">
                                <Mail size={18} /> Email
                            </a>
                        </div>
                    </div>

                    <div className="dev-details-grid">

                        <section className="dev-section">
                            <div className="section-title">
                                <Award size={20} />
                                <h3>Key Projects</h3>
                            </div>
                            <ul className="dev-project-list">
                                <li>
                                    <strong>QuickShop</strong>
                                    <p>Full-Stack E-Commerce Platform with modern features.</p>
                                </li>
                                <li>
                                    <strong>OpenDiscover</strong>
                                    <p>Modern Discovery Platform (⭐ 50+ Stars on GitHub).</p>
                                </li>
                                <li>
                                    <strong>EventProject</strong>
                                    <p>Contest & Event Management System for organizations.</p>
                                </li>
                                <li>
                                    <strong>Open-Mercato</strong>
                                    <p>AI-Supportive Enterprise CRM/ERP solution.</p>
                                </li>
                                <li>
                                    <strong>Shizuku Apps</strong>
                                    <p>Collection of Rootless Android Power Tools.</p>
                                </li>
                                <li>
                                    <strong>AI Medical Assistant</strong>
                                    <p>Intelligent Healthcare Companion using AI.</p>
                                </li>
                            </ul>
                        </section>

                        <section className="dev-section">
                            <div className="section-title">
                                <Heart size={20} />
                                <h3>About Me</h3>
                            </div>
                            <div className="dev-bio-new">
                                <p className="bio-intro">
                                    I am a <strong>Full-Stack Software Developer</strong> from India,
                                    dedicated to crafting high-performance, beautiful digital experiences.
                                    My journey is driven by a deep curiosity for how technology can solve
                                    real-world problems with elegant code and intuitive design.
                                </p>
                                <div className="bio-grid">
                                    <div className="bio-item">🤝 Open to <span>Collaborations</span></div>
                                </div>
                                <div className="contact-professional">
                                    <a href="mailto:kk3163019@gmail.com" className="professional-email-btn">
                                        <Mail size={18} />
                                        <span>Hire Me / Professional Inquiry</span>
                                    </a>
                                </div>
                                <p className="bio-fact">⚡ Fun fact: <strong>I am a Funny webber🕸️🕸️</strong></p>
                            </div>
                        </section>
                        <section className="dev-section bug-report-section">
                            <div className="section-title">
                                <ExternalLink size={20} />
                                <h3>Report Issues / Bugs</h3>
                            </div>
                            <p style={{ color: '#9aa0a6', fontSize: '14px', marginBottom: '16px' }}>Click the button below to report bugs using Formspree:</p>
                            <div id="formspree-widget"></div>
                        </section>
                    </div>
                </div>

                <div className="dev-footer">
                    <p>Build with love from <b>INDIA</b> 🇮🇳</p>
                    <a href="https://github.com/krishna3163/GooglePhoto_Alternative" target="_blank" rel="noreferrer">
                        Star on GitHub <ExternalLink size={14} />
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DeveloperProfile;
