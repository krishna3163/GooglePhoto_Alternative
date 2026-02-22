import React, { useState } from 'react';
import { AlertCircle, Server, QrCode } from 'lucide-react';
import type { TelegramConfig } from '../types';
import { getStorageInfo } from '../services/unifiedStorageService';
import './UploadDestinationModal.css';

interface UploadDestinationModalProps {
    config: TelegramConfig;
    onSelect: (model: 'model1' | 'model3') => void;
    onClose: () => void;
}

const UploadDestinationModal: React.FC<UploadDestinationModalProps> = ({
    config,
    onSelect,
    onClose
}) => {
    const currentStorage = getStorageInfo(config);
    const [selectedModel, setSelectedModel] = useState<'model1' | 'model3'>(config.storageModel || 'model1');

    const isDeveloperMode = config.isDeveloperMode === true;
    const hasModel3Session = config.model3Session && config.model3Session.isActive;

    const handleSelect = () => {
        onSelect(selectedModel);
        onClose();
    };

    return (
        <div className="upload-destination-overlay">
            <div className="upload-destination-modal">
                <div className="udt-header">
                    <h2>Select Upload Destination</h2>
                    <button className="close-udt" onClick={onClose}>&times;</button>
                </div>

                <div className="udt-content">
                    <p className="udt-subtitle">Choose where to store your files</p>

                    {/* Model 1 - Always Available */}
                    <div className="destination-option">
                        <input
                            type="radio"
                            id="model1"
                            name="destination"
                            value="model1"
                            checked={selectedModel === 'model1'}
                            onChange={() => setSelectedModel('model1')}
                        />
                        <label htmlFor="model1" className="destination-label">
                            <div className="destination-icon model1">
                                <Server size={24} />
                            </div>
                            <div className="destination-info">
                                <h3>🤖 Telegram Bot Storage (Model 1)</h3>
                                <p>Store files using your Telegram bot channel</p>
                                <span className="badge default">DEFAULT</span>
                            </div>
                        </label>
                    </div>

                    {/* Model 3 - Only in Developer Mode */}
                    {isDeveloperMode ? (
                        <div className={`destination-option ${!hasModel3Session ? 'disabled' : ''}`}>
                            <input
                                type="radio"
                                id="model3"
                                name="destination"
                                value="model3"
                                checked={selectedModel === 'model3'}
                                onChange={() => setSelectedModel('model3')}
                                disabled={!hasModel3Session}
                            />
                            <label htmlFor="model3" className="destination-label">
                                <div className="destination-icon model3">
                                    <QrCode size={24} />
                                </div>
                                <div className="destination-info">
                                    <h3>📱 Telegram Account Cloud (Model 3)</h3>
                                    <p>Store files in your Telegram Saved Messages</p>
                                    {hasModel3Session ? (
                                        <span className="badge experimental">EXPERIMENTAL</span>
                                    ) : (
                                        <span className="badge disabled">REQUIRES LOGIN</span>
                                    )}
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="destination-option disabled-message">
                            <div className="alert-box">
                                <AlertCircle size={18} />
                                <p>Enable Developer Mode to use Telegram Account Cloud (Model 3)</p>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="storage-info-box">
                        <h4>Current Storage: {currentStorage.name}</h4>
                        <p>{currentStorage.description}</p>
                        {currentStorage.isExperimental && (
                            <div className="experimental-warning">
                                <AlertCircle size={16} />
                                <span>This is an experimental feature</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="udt-footer">
                    <button className="cancel-udt-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="confirm-udt-btn"
                        onClick={handleSelect}
                        disabled={selectedModel === 'model3' && !hasModel3Session}
                    >
                        Use This Storage
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadDestinationModal;
