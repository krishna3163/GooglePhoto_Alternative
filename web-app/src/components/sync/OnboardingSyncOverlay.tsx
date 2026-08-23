import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CloudDownload } from 'lucide-react';
import './OnboardingSyncOverlay.css';

interface OnboardingSyncOverlayProps {
    isOpen: boolean;
    syncedCount: number;
    totalCount: number;
    onContinueInBackground: () => void;
}

export const OnboardingSyncOverlay: React.FC<OnboardingSyncOverlayProps> = ({
    isOpen,
    syncedCount,
    totalCount,
    onContinueInBackground,
}) => {
    if (!isOpen) return null;

    const percent = totalCount > 0 ? Math.min(100, Math.round((syncedCount / totalCount) * 100)) : 20;

    return (
        <div className="onboarding-sync-overlay">
            <motion.div
                className="onboarding-sync-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="onboarding-sync-brand">
                    <img src="/icon.png" alt="TeleGphoto" className="onboarding-brand-logo" />
                    <h2>Restoring your private library</h2>
                    <p>Your media stays zero-knowledge encrypted on Telegram.</p>
                </div>

                <div className="onboarding-progress-block">
                    <div className="onboarding-progress-track">
                        <div className="onboarding-progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="onboarding-progress-labels">
                        <span>{syncedCount} of {totalCount || '...'} items</span>
                        <span>{percent}%</span>
                    </div>
                </div>

                <div className="onboarding-security-badge">
                    <ShieldCheck size={16} color="#3DDC97" />
                    <span>Client-side metadata decryption active</span>
                </div>

                <button
                    className="onboarding-continue-btn"
                    onClick={onContinueInBackground}
                >
                    <CloudDownload size={15} />
                    <span>Continue in background</span>
                </button>
            </motion.div>
        </div>
    );
};

export default OnboardingSyncOverlay;
