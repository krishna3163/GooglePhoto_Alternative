import React from 'react';
import { X, Image, Film, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './StorageAnalyticsModal.css';

interface StorageAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    usedBytes: number;
    totalGB: number;
    photosCount: number;
    videosCount: number;
    docsCount: number;
    trashCount: number;
    onEmptyTrash: () => void;
}

export const StorageAnalyticsModal: React.FC<StorageAnalyticsModalProps> = ({
    isOpen,
    onClose,
    usedBytes,
    totalGB,
    photosCount,
    videosCount,
    docsCount,
    trashCount,
    onEmptyTrash,
}) => {
    if (!isOpen) return null;

    const usedGB = usedBytes / (1024 * 1024 * 1024);
    const percent = Math.min(100, Math.round((usedGB / totalGB) * 100));

    return (
        <div className="analytics-modal-overlay">
            <motion.div
                className="analytics-modal-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="analytics-modal-header">
                    <div className="analytics-title-group">
                        <h3>Storage Management</h3>
                        <span>Telegram-powered decentralized cloud allocation</span>
                    </div>
                    <button className="analytics-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="analytics-body">
                    {/* Big Gauge */}
                    <div className="storage-gauge-card">
                        <div className="gauge-header">
                            <span className="gauge-used">
                                {usedGB > 1000 ? `${(usedGB / 1024).toFixed(2)} TB` : `${usedGB.toFixed(1)} GB`}
                            </span>
                            <span className="gauge-total">
                                of {totalGB >= 1000 ? `${(totalGB / 1024).toFixed(0)} TB` : `${totalGB} GB`} ({percent}%)
                            </span>
                        </div>

                        <div className="gauge-track">
                            <div className="gauge-fill" style={{ width: `${percent}%` }} />
                        </div>
                    </div>

                    {/* Breakdown by Type */}
                    <div className="storage-breakdown-list">
                        <div className="breakdown-row">
                            <div className="breakdown-icon-badge photos">
                                <Image size={18} color="#FFC928" />
                            </div>
                            <div className="breakdown-meta">
                                <span className="breakdown-name">Photos</span>
                                <span className="breakdown-count">{photosCount} files</span>
                            </div>
                            <span className="breakdown-size">{(photosCount * 4.2).toFixed(1)} MB</span>
                        </div>

                        <div className="breakdown-row">
                            <div className="breakdown-icon-badge videos">
                                <Film size={18} color="#38BDF8" />
                            </div>
                            <div className="breakdown-meta">
                                <span className="breakdown-name">Videos</span>
                                <span className="breakdown-count">{videosCount} files</span>
                            </div>
                            <span className="breakdown-size">{(videosCount * 28.5).toFixed(1)} MB</span>
                        </div>

                        <div className="breakdown-row">
                            <div className="breakdown-icon-badge docs">
                                <FileText size={18} color="#3DDC97" />
                            </div>
                            <div className="breakdown-meta">
                                <span className="breakdown-name">Documents</span>
                                <span className="breakdown-count">{docsCount} files</span>
                            </div>
                            <span className="breakdown-size">{(docsCount * 1.5).toFixed(1)} MB</span>
                        </div>

                        <div className="breakdown-row">
                            <div className="breakdown-icon-badge trash">
                                <Trash2 size={18} color="#FF5C6C" />
                            </div>
                            <div className="breakdown-meta">
                                <span className="breakdown-name">Trash</span>
                                <span className="breakdown-count">{trashCount} files</span>
                            </div>
                            <span className="breakdown-size">{(trashCount * 4.0).toFixed(1)} MB</span>
                        </div>
                    </div>

                    {/* Quick Clean Actions */}
                    <div className="storage-cleanup-actions">
                        <button
                            className="cleanup-action-btn"
                            onClick={() => {
                                onEmptyTrash();
                                onClose();
                            }}
                            disabled={trashCount === 0}
                        >
                            <Trash2 size={16} />
                            <span>Empty Trash ({trashCount} items)</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StorageAnalyticsModal;
