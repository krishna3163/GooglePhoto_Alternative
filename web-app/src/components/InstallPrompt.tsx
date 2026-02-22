import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './InstallPrompt.css';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Only show if user hasn't seen it recently or based on logic
            const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!hasDismissed) {
                // Delay for better UX
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        setIsVisible(false);
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Don't show again for 7 days
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="install-prompt-banner"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                >
                    <div className="install-icon-box">
                        <Smartphone size={24} />
                    </div>
                    <div className="install-text">
                        <h4>Install TeleGphoto</h4>
                        <p>Add to your home screen for a better experience</p>
                    </div>
                    <div className="install-actions">
                        <button className="install-btn" onClick={handleInstallClick}>
                            <Download size={18} />
                            Install
                        </button>
                        <button className="dismiss-btn" onClick={handleDismiss}>
                            <X size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
