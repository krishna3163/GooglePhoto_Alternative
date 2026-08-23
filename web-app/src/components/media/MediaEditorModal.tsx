import React, { useState } from 'react';
import type { PhotoAsset } from '../../types';
import { X, Sliders, Crop, RotateCw, RotateCcw, FileText, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import './MediaEditorModal.css';

interface MediaEditorModalProps {
    photo: PhotoAsset;
    isOpen: boolean;
    onClose: () => void;
    onSaveEdits: (photoId: string, edits: {
        fileName?: string;
        brightness?: number;
        contrast?: number;
        saturation?: number;
        rotation?: number;
        aspectRatio?: string;
    }) => void;
}

type EditorTab = 'details' | 'adjust' | 'crop' | 'rotate';

const MediaEditorModal: React.FC<MediaEditorModalProps> = ({
    photo,
    isOpen,
    onClose,
    onSaveEdits,
}) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('adjust');
    const [fileName, setFileName] = useState(photo.fileName);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [aspectRatio, setAspectRatio] = useState('free');

    if (!isOpen) return null;

    const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
    const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

    const handleSave = () => {
        onSaveEdits(photo.id, {
            fileName,
            brightness,
            contrast,
            saturation,
            rotation,
            aspectRatio,
        });
        onClose();
    };

    const filterStyle = {
        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`,
        transform: `rotate(${rotation}deg)`,
    };

    return (
        <div className="editor-modal-overlay">
            <motion.div
                className="editor-modal-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="editor-header">
                    <div className="editor-title-group">
                        <h3>Photo Editor (Non-Destructive)</h3>
                        <span>Original media bytes remain 100% untouched</span>
                    </div>
                    <div className="editor-header-actions">
                        <button className="editor-save-btn" onClick={handleSave}>
                            <Save size={16} />
                            <span>Save Edit</span>
                        </button>
                        <button className="editor-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="editor-body">
                    {/* Left Canvas Preview */}
                    <div className="editor-canvas-container">
                        <img
                            src={photo.url}
                            alt={photo.fileName}
                            className="editor-canvas-image"
                            style={filterStyle}
                        />
                    </div>

                    {/* Right Tools Controls */}
                    <div className="editor-controls-sidebar">
                        {/* Tab Switcher */}
                        <div className="editor-tabs-bar">
                            <button
                                className={`editor-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                <FileText size={15} />
                                <span>Details</span>
                            </button>
                            <button
                                className={`editor-tab-btn ${activeTab === 'adjust' ? 'active' : ''}`}
                                onClick={() => setActiveTab('adjust')}
                            >
                                <Sliders size={15} />
                                <span>Adjust</span>
                            </button>
                            <button
                                className={`editor-tab-btn ${activeTab === 'crop' ? 'active' : ''}`}
                                onClick={() => setActiveTab('crop')}
                            >
                                <Crop size={15} />
                                <span>Crop</span>
                            </button>
                            <button
                                className={`editor-tab-btn ${activeTab === 'rotate' ? 'active' : ''}`}
                                onClick={() => setActiveTab('rotate')}
                            >
                                <RotateCw size={15} />
                                <span>Rotate</span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="editor-tab-pane">
                            {activeTab === 'details' && (
                                <div className="editor-form-group">
                                    <label>File Name</label>
                                    <input
                                        type="text"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        className="editor-input"
                                    />
                                    <span className="editor-hint">Rename will update display metadata</span>
                                </div>
                            )}

                            {activeTab === 'adjust' && (
                                <div className="editor-adjust-controls">
                                    <div className="slider-control">
                                        <div className="slider-label-row">
                                            <span>Brightness</span>
                                            <b>{brightness > 0 ? `+${brightness}` : brightness}</b>
                                        </div>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            value={brightness}
                                            onChange={(e) => setBrightness(Number(e.target.value))}
                                            className="editor-slider"
                                        />
                                    </div>

                                    <div className="slider-control">
                                        <div className="slider-label-row">
                                            <span>Contrast</span>
                                            <b>{contrast > 0 ? `+${contrast}` : contrast}</b>
                                        </div>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            value={contrast}
                                            onChange={(e) => setContrast(Number(e.target.value))}
                                            className="editor-slider"
                                        />
                                    </div>

                                    <div className="slider-control">
                                        <div className="slider-label-row">
                                            <span>Saturation</span>
                                            <b>{saturation > 0 ? `+${saturation}` : saturation}</b>
                                        </div>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            value={saturation}
                                            onChange={(e) => setSaturation(Number(e.target.value))}
                                            className="editor-slider"
                                        />
                                    </div>

                                    <button
                                        className="editor-reset-btn"
                                        onClick={() => {
                                            setBrightness(0);
                                            setContrast(0);
                                            setSaturation(0);
                                        }}
                                    >
                                        Reset Adjustments
                                    </button>
                                </div>
                            )}

                            {activeTab === 'crop' && (
                                <div className="editor-crop-controls">
                                    <label>Aspect Ratio</label>
                                    <div className="aspect-ratio-grid">
                                        {['free', '1:1', '4:3', '16:9'].map((ratio) => (
                                            <button
                                                key={ratio}
                                                className={`ratio-btn ${aspectRatio === ratio ? 'selected' : ''}`}
                                                onClick={() => setAspectRatio(ratio)}
                                            >
                                                {ratio.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'rotate' && (
                                <div className="editor-rotate-controls">
                                    <div className="rotate-btn-row">
                                        <button className="rotate-action-btn" onClick={handleRotateLeft}>
                                            <RotateCcw size={20} />
                                            <span>90° Left</span>
                                        </button>
                                        <button className="rotate-action-btn" onClick={handleRotateRight}>
                                            <RotateCw size={20} />
                                            <span>90° Right</span>
                                        </button>
                                    </div>
                                    <span className="current-rotation-text">Current Angle: {rotation}°</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MediaEditorModal;
