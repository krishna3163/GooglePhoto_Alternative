import React, { useRef, useState, useEffect } from 'react';
import { Search, Upload, HelpCircle, Settings, FolderPlus, LogOut, Check, Edit3, Heart, BookOpen, Users, ExternalLink, Shield, LayoutGrid, List, Menu } from 'lucide-react';
import type { TelegramConfig } from '../types';
import type { LayoutMode } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import './Header.css';

interface HeaderProps {
    config: TelegramConfig | null;
    userName: string;
    onSettingsClick: () => void;
    onSearchChange: (query: string) => void;
    onUpdateName: (newName: string) => void;
    onHelpClick: () => void;
    onDevClick: () => void;
    onFilesSelected: (files: FileList) => void;
    onDeveloperModeToggle?: (enabled: boolean) => void;
    layoutMode?: LayoutMode;
    onLayoutChange?: (mode: LayoutMode) => void;
    showLayoutToggle?: boolean;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    config,
    userName,
    onSettingsClick,
    onSearchChange,
    onUpdateName,
    onHelpClick,
    onDevClick,
    onFilesSelected,
    onDeveloperModeToggle,
    layoutMode = 'grid',
    onLayoutChange,
    showLayoutToggle = false,
    onMenuClick
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [devTapCount, setDevTapCount] = useState(0);
    const devTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(userName);

    // 5-tap developer mode activation
    const handleLogoClick = () => {
        setDevTapCount(prev => {
            const newCount = prev + 1;
            
            if (devTapTimeoutRef.current) {
                clearTimeout(devTapTimeoutRef.current);
            }

            if (newCount === 5) {
                // Activate developer mode
                const newDevMode = !config?.isDeveloperMode;
                onDeveloperModeToggle?.(newDevMode);
                setDevTapCount(0);
                return 0;
            }

            // Reset tap count after 2 seconds
            devTapTimeoutRef.current = setTimeout(() => {
                setDevTapCount(0);
            }, 2000);

            return newCount;
        });
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFolderClick = () => {
        folderInputRef.current?.click();
    };

    const handleSaveName = () => {
        onUpdateName(editedName);
        setIsEditingName(false);
    };

    const processFiles = (files: FileList | null) => {
        if (!files || files.length === 0 || !config) return;
        onFilesSelected(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    useEffect(() => {
        return () => {
            if (devTapTimeoutRef.current) {
                clearTimeout(devTapTimeoutRef.current);
            }
        };
    }, []);

    return (
        <header className="header">
            <div className="header-left">
                {onMenuClick && (
                    <motion.button
                        type="button"
                        className="icon-button header-menu-btn"
                        title="Menu"
                        onClick={onMenuClick}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Open menu"
                    >
                        <Menu size={22} />
                    </motion.button>
                )}
                <motion.div
                    className="logo-container"
                    onClick={handleLogoClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={devTapCount > 0 ? `Developer mode taps: ${devTapCount}/5` : (config?.isDeveloperMode ? 'Developer mode ON (tap to toggle)' : 'Tap 5× to enable Developer mode')}
                >
                    <img src="/icon.png" alt="TeleGphoto" className="logo-img" onError={(e) => (e.currentTarget.src = './logo.svg')} />
                    <span className="logo-text">TeleGphoto</span>
                    {config?.isDeveloperMode && (
                        <span className="dev-mode-badge" title="Developer mode">Dev</span>
                    )}
                </motion.div>
            </div>

            <div className="header-center">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder='Search "OCR text, filename, or type"'
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="header-right">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => processFiles(e.target.files)}
                    accept="image/*,video/*,application/pdf"
                    multiple
                />
                <input
                    type="file"
                    ref={folderInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => processFiles(e.target.files)}
                    {...({ webkitdirectory: "", directory: "" } as any)}
                />

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="icon-button" title="Upload Files" onClick={handleUploadClick}>
                    <Upload size={20} />
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="icon-button" title="Upload Folder" onClick={handleFolderClick}>
                    <FolderPlus size={20} />
                </motion.div>

                {showLayoutToggle && onLayoutChange && (
                    <div className="layout-toggle" role="group" aria-label="View layout">
                        <motion.button
                            type="button"
                            className={`icon-button layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                            title="Grid view"
                            onClick={() => onLayoutChange('grid')}
                            whileTap={{ scale: 0.9 }}
                        >
                            <LayoutGrid size={20} />
                        </motion.button>
                        <motion.button
                            type="button"
                            className={`icon-button layout-btn ${layoutMode === 'list' ? 'active' : ''}`}
                            title="List view"
                            onClick={() => onLayoutChange('list')}
                            whileTap={{ scale: 0.9 }}
                        >
                            <List size={20} />
                        </motion.button>
                    </div>
                )}

                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="icon-button"
                    title="Setup Guide"
                    onClick={onHelpClick}
                >
                    <HelpCircle size={20} />
                </motion.div>

                <div className="profile-container">
                    <motion.div
                        className="profile-img"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        whileTap={{ scale: 0.9 }}
                    >
                        {userName.charAt(0).toUpperCase()}
                    </motion.div>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                className="profile-dropdown"
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            >
                                <div className="dropdown-user-info">
                                    <div className="dropdown-avatar">{userName.charAt(0).toUpperCase()}</div>
                                    <div className="dropdown-details">
                                        {isEditingName ? (
                                            <div className="name-edit-box">
                                                <input
                                                    type="text"
                                                    value={editedName}
                                                    onChange={(e) => setEditedName(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveName}><Check size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="name-display-box">
                                                <span className="user-name">{userName}</span>
                                                <button onClick={() => setIsEditingName(true)}><Edit3 size={14} /></button>
                                            </div>
                                        )}
                                        <span className="user-email">TeleGphoto Cloud</span>
                                    </div>
                                </div>

                                <div className="dropdown-divider"></div>

                                <div className="dropdown-item" onClick={onSettingsClick}>
                                    <Settings size={18} />
                                    <span>Settings</span>
                                </div>

                                {onDeveloperModeToggle && (
                                    <div className="dropdown-item developer-mode-row">
                                        <Shield size={18} />
                                        <span>Developer mode</span>
                                        <label className="header-dev-toggle" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={!!config?.isDeveloperMode}
                                                onChange={(e) => onDeveloperModeToggle(e.target.checked)}
                                            />
                                            <span className="header-dev-slider" />
                                        </label>
                                    </div>
                                )}

                                <div className="dropdown-item" onClick={onDevClick}>
                                    <Users size={18} />
                                    <span>Developer Profile</span>
                                </div>

                                <div className="dropdown-item" onClick={onHelpClick}>
                                    <BookOpen size={18} />
                                    <span>Setup Guide & About</span>
                                </div>

                                <a href="https://formspree.io/f/xeelrpdd" target="_blank" rel="noreferrer" className="dropdown-item">
                                    <ExternalLink size={18} />
                                    <span>Report a Bug</span>
                                </a>

                                <div className="dropdown-divider"></div>

                                <div className="india-pride">
                                    <span>Build with <Heart size={12} fill="#ff4b2b" color="#ff4b2b" strokeWidth={3} /> from <b>INDIA</b></span>
                                    <span className="flag-emoji">🇮🇳</span>
                                </div>

                                <div className="dropdown-divider"></div>

                                <div className="dropdown-item sign-out-item" onClick={() => window.location.reload()}>
                                    <LogOut size={18} />
                                    <span>Sign out</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

        </header>
    );
};

export default Header;
