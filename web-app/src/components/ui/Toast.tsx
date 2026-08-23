import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    text: string;
    undoAction?: () => void;
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        className={`toast-item toast-${toast.type}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="toast-icon">
                            {toast.type === 'success' && <CheckCircle2 size={18} color="#3DDC97" />}
                            {toast.type === 'error' && <AlertCircle size={18} color="#FF5C6C" />}
                            {toast.type === 'info' && <Info size={18} color="#FFC928" />}
                        </div>
                        <span className="toast-text">{toast.text}</span>
                        {toast.undoAction && (
                            <button
                                className="toast-undo-btn"
                                onClick={() => {
                                    toast.undoAction?.();
                                    onDismiss(toast.id);
                                }}
                            >
                                Undo
                            </button>
                        )}
                        <button className="toast-close-btn" onClick={() => onDismiss(toast.id)}>
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
