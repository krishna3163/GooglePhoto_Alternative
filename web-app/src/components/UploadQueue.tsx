import React from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UploadItem } from '../types';
import './UploadQueue.css';

interface UploadQueueProps {
    items: UploadItem[];
    onRetry: (id: string) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
}

const UploadQueue: React.FC<UploadQueueProps> = ({ items, onRetry, onRemove, onClose }) => {
    if (items.length === 0) return null;

    return (
        <motion.div
            className="upload-queue-container"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
        >
            <div className="queue-header">
                <h3>Upload Queue ({items.length})</h3>
                <button className="close-queue-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>
            <div className="queue-list">
                {items.map((item) => (
                    <div key={item.id} className={`queue-item ${item.status}`}>
                        <div className="item-info">
                            <span className="file-name" title={item.file.name}>{item.file.name}</span>
                            <span className="item-status">
                                {item.status === 'pending' && 'Pending...'}
                                {item.status === 'uploading' && `Uploading: ${item.progress}%`}
                                {item.status === 'success' && 'Success!'}
                                {item.status === 'failed' && 'Failed'}
                            </span>
                        </div>

                        <div className="item-progress-container">
                            <div
                                className={`item-progress-bar ${item.status === 'uploading' ? 'animated' : ''}`}
                                style={{ width: `${item.progress}%` }}
                            ></div>
                        </div>

                        <div className="item-actions">
                            {item.status === 'failed' && (
                                <button className="retry-btn" onClick={() => onRetry(item.id)} title="Retry">
                                    <RefreshCw size={16} />
                                </button>
                            )}
                            {item.status === 'success' ? (
                                <CheckCircle size={16} className="status-icon success" />
                            ) : item.status === 'failed' ? (
                                <AlertCircle size={16} className="status-icon failed" />
                            ) : item.status === 'uploading' ? (
                                <Loader2 size={16} className="status-icon rotating" />
                            ) : null}
                            <button className="remove-item-btn" onClick={() => onRemove(item.id)}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default UploadQueue;
