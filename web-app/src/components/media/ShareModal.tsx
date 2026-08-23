import React, { useState } from 'react';
import type { PhotoAsset } from '../../types';
import { X, Copy, Download, Share2, Check, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import './ShareModal.css';

interface ShareModalProps {
    photo: PhotoAsset;
    isOpen: boolean;
    onClose: () => void;
    onDownloadDecrypted: (photo: PhotoAsset) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    photo,
    isOpen,
    onClose,
    onDownloadDecrypted,
}) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/#photo-${photo.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: photo.fileName,
                    text: `View photo ${photo.fileName} in TeleGphoto`,
                    url: shareUrl,
                });
            } catch {
                // Ignore cancel
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="share-modal-overlay">
            <motion.div
                className="share-modal-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="share-modal-header">
                    <h3>Share Photo</h3>
                    <button className="share-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="share-modal-content">
                    <div className="share-security-notice">
                        <Shield size={16} color="#FFC928" />
                        <span>Zero-Knowledge: Direct decryption keys are never exposed in public links.</span>
                    </div>

                    <div className="share-link-box">
                        <input type="text" readOnly value={shareUrl} className="share-link-input" />
                        <button className="share-copy-btn" onClick={handleCopy}>
                            {copied ? <Check size={16} color="#3DDC97" /> : <Copy size={16} />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>

                    <div className="share-actions-grid">
                        <button className="share-method-btn" onClick={handleNativeShare}>
                            <Share2 size={20} color="#FFC928" />
                            <span>System Share</span>
                        </button>

                        <button
                            className="share-method-btn"
                            onClick={() => {
                                onDownloadDecrypted(photo);
                                onClose();
                            }}
                        >
                            <Download size={20} color="#38BDF8" />
                            <span>Export Decrypted</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ShareModal;
