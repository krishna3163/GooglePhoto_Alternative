import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, Trash2, File } from 'lucide-react';
import { motion } from 'framer-motion';
import './UploadManagerModal.css';

export interface UploadQueueItem {
    id: string;
    file: File;
    name: string;
    size: number;
    progress: number;
    status: 'queued' | 'hashing' | 'checking_duplicates' | 'encrypting' | 'uploading' | 'completed' | 'failed';
    error?: string;
    previewUrl?: string;
}

interface UploadManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    queue: UploadQueueItem[];
    onAddFiles: (files: FileList | File[]) => void;
    onRetryItem: (id: string) => void;
    onRemoveItem: (id: string) => void;
    onClearCompleted: () => void;
}

const UploadManagerModal: React.FC<UploadManagerModalProps> = ({
    isOpen,
    onClose,
    queue,
    onAddFiles,
    onRetryItem,
    onRemoveItem,
    onClearCompleted,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onAddFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddFiles(e.target.files);
        }
    };

    const completedCount = queue.filter(q => q.status === 'completed').length;

    return (
        <div className="upload-modal-overlay">
            <motion.div
                className="upload-modal-card"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2 }}
            >
                {/* Modal Header */}
                <div className="upload-modal-header">
                    <div className="upload-header-title-group">
                        <h3>Upload Manager</h3>
                        <span className="upload-status-sub">
                            {queue.length > 0
                                ? `${completedCount} of ${queue.length} completed`
                                : 'Add photos, videos or documents'}
                        </span>
                    </div>
                    <div className="upload-header-actions">
                        {completedCount > 0 && (
                            <button className="upload-clear-btn" onClick={onClearCompleted}>
                                Clear Completed
                            </button>
                        )}
                        <button className="upload-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    className={`upload-dropzone-box ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                    />
                    <div className="upload-dropzone-icon">
                        <Upload size={32} color="#FFC928" />
                    </div>
                    <div className="upload-dropzone-text">
                        <h4>Drop your files here, or <span>Browse</span></h4>
                        <p>End-to-End Encrypted via AES-256-GCM before Telegram storage</p>
                    </div>
                </div>

                {/* Upload Queue List */}
                {queue.length > 0 && (
                    <div className="upload-queue-scroll-list">
                        {queue.map((item) => (
                            <div key={item.id} className={`upload-queue-item-row status-${item.status}`}>
                                <div className="queue-item-preview">
                                    {item.previewUrl ? (
                                        <img src={item.previewUrl} alt={item.name} />
                                    ) : (
                                        <File size={20} color="#FFC928" />
                                    )}
                                </div>

                                <div className="queue-item-info">
                                    <div className="queue-item-top">
                                        <span className="queue-item-name" title={item.name}>{item.name}</span>
                                        <span className="queue-item-size">
                                            {(item.size / (1024 * 1024)).toFixed(1)} MB
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="queue-item-progress-track">
                                        <div
                                            className={`queue-item-progress-bar ${item.status}`}
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>

                                    <div className="queue-item-status-text">
                                        {item.status === 'hashing' && 'Calculating SHA-256 hash...'}
                                        {item.status === 'checking_duplicates' && 'Checking duplicates...'}
                                        {item.status === 'encrypting' && '🔒 AES-256-GCM Encrypting...'}
                                        {item.status === 'uploading' && `Uploading (${item.progress}%)...`}
                                        {item.status === 'completed' && '✅ Upload Complete'}
                                        {item.status === 'failed' && `❌ Error: ${item.error || 'Failed'}`}
                                        {item.status === 'queued' && 'Queued'}
                                    </div>
                                </div>

                                <div className="queue-item-actions">
                                    {item.status === 'failed' && (
                                        <button
                                            className="queue-action-btn retry"
                                            onClick={() => onRetryItem(item.id)}
                                            title="Retry"
                                        >
                                            <RefreshCw size={15} />
                                        </button>
                                    )}
                                    <button
                                        className="queue-action-btn remove"
                                        onClick={() => onRemoveItem(item.id)}
                                        title="Remove"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default UploadManagerModal;
