import React from 'react';
import { X, ShieldCheck, Lock, Key, Cpu, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import './SecurityPrivacyModal.css';

interface SecurityPrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeVaultName: string;
    onOpenDevices?: () => void;
}

export const SecurityPrivacyModal: React.FC<SecurityPrivacyModalProps> = ({
    isOpen,
    onClose,
    activeVaultName,
    onOpenDevices,
}) => {
    if (!isOpen) return null;

    return (
        <div className="security-modal-overlay">
            <motion.div
                className="security-modal-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="security-modal-header">
                    <div className="security-title-group">
                        <h3>Security & Encryption Architecture</h3>
                        <span>Zero-knowledge client-side cryptographic guarantees</span>
                    </div>
                    <button className="security-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="security-body">
                    {/* Status Badge */}
                    <div className="security-status-banner">
                        <ShieldCheck size={28} color="#3DDC97" />
                        <div>
                            <h4>Active Vault: {activeVaultName}</h4>
                            <p>All photos are encrypted locally with unique random IVs before leaving your device.</p>
                        </div>
                    </div>

                    <div className="security-specs-list">
                        <div className="security-spec-item">
                            <Lock size={18} color="#FFC928" />
                            <div className="spec-meta">
                                <span className="spec-title">Encryption Algorithm</span>
                                <span className="spec-desc">AES-256-GCM authenticated envelope encryption</span>
                            </div>
                            <span className="spec-badge">Active</span>
                        </div>

                        <div className="security-spec-item">
                            <Key size={18} color="#FFC928" />
                            <div className="spec-meta">
                                <span className="spec-title">Key Derivation</span>
                                <span className="spec-desc">PBKDF2 (SHA-256) with 100,000 iterations & random salt</span>
                            </div>
                            <span className="spec-badge">Hardened</span>
                        </div>

                        <div className="security-spec-item">
                            <Cpu size={18} color="#FFC928" />
                            <div className="spec-meta">
                                <span className="spec-title">Local Intelligence Isolation</span>
                                <span className="spec-desc">Embeddings & OCR run 100% on-device (Zero cloud AI leakage)</span>
                            </div>
                            <span className="spec-badge">Private</span>
                        </div>

                        <div className="security-spec-item">
                            <RefreshCw size={18} color="#FFC928" />
                            <div className="spec-meta">
                                <span className="spec-title">Memory & Blob Hygiene</span>
                                <span className="spec-desc">Tracked Object URLs automatically revoked to prevent RAM leaks</span>
                            </div>
                            <span className="spec-badge">Active</span>
                        </div>
                    </div>

                    {onOpenDevices && (
                        <div style={{ marginTop: '6px' }}>
                            <button
                                className="security-devices-action-btn"
                                onClick={() => {
                                    onClose();
                                    onOpenDevices();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 201, 40, 0.1)',
                                    border: '1px solid rgba(255, 201, 40, 0.25)',
                                    color: '#FFC928',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                Manage Connected Devices
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};


export default SecurityPrivacyModal;
