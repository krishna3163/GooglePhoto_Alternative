import React, { useState } from 'react';
import { X, Lock, Image, Film, FileText, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import './VaultSwitcherModal.css';

interface VaultSwitcherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateVault: (vault: { name: string; type: 'photos' | 'videos' | 'documents' | 'family'; description?: string }) => void;
}

const VaultSwitcherModal: React.FC<VaultSwitcherModalProps> = ({
    isOpen,
    onClose,
    onCreateVault,
}) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'photos' | 'videos' | 'documents' | 'family'>('photos');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreateVault({
            name: name.trim(),
            type,
            description: description.trim(),
        });
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <div className="vault-modal-overlay">
            <motion.div
                className="vault-modal-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="vault-modal-header">
                    <div className="vault-title-group">
                        <h3>Create Encrypted Vault</h3>
                        <span>Isolated encryption boundary & zero-knowledge storage</span>
                    </div>
                    <button className="vault-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="vault-modal-form">
                    <div className="vault-form-group">
                        <label>Vault Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Family Archive, Travel Vault"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="vault-modal-input"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="vault-form-group">
                        <label>Vault Type</label>
                        <div className="vault-type-selector-grid">
                            <button
                                type="button"
                                className={`vault-type-btn ${type === 'photos' ? 'selected' : ''}`}
                                onClick={() => setType('photos')}
                            >
                                <Image size={20} color="#FFC928" />
                                <span>Photos</span>
                            </button>

                            <button
                                type="button"
                                className={`vault-type-btn ${type === 'videos' ? 'selected' : ''}`}
                                onClick={() => setType('videos')}
                            >
                                <Film size={20} color="#38BDF8" />
                                <span>Videos</span>
                            </button>

                            <button
                                type="button"
                                className={`vault-type-btn ${type === 'documents' ? 'selected' : ''}`}
                                onClick={() => setType('documents')}
                            >
                                <FileText size={20} color="#3DDC97" />
                                <span>Documents</span>
                            </button>

                            <button
                                type="button"
                                className={`vault-type-btn ${type === 'family' ? 'selected' : ''}`}
                                onClick={() => setType('family')}
                            >
                                <Users size={20} color="#FF5C6C" />
                                <span>Family</span>
                            </button>
                        </div>
                    </div>

                    <div className="vault-form-group">
                        <label>Optional Description</label>
                        <input
                            type="text"
                            placeholder="e.g. Private family memories and trips"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="vault-modal-input"
                        />
                    </div>

                    <div className="vault-encryption-badge">
                        <Lock size={15} color="#FFC928" />
                        <span>Every vault receives its own cryptographically isolated key wrapping.</span>
                    </div>

                    <div className="vault-modal-btn-row">
                        <button type="button" className="vault-cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="vault-submit-btn"
                            disabled={!name.trim()}
                        >
                            Create Vault
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default VaultSwitcherModal;
