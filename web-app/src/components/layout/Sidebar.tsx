import React, { useState } from 'react';
import {
    Image,
    Folder,
    Sparkles,
    Star,
    LayoutGrid,
    Search,
    UploadCloud,
    Trash2,
    Activity,
    Shield,
    Lock,
    Settings,
    ChevronDown,
    Plus,
    X,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

export interface VaultInfo {
    id: string;
    name: string;
    chatId: string;
    type: 'photos' | 'videos' | 'documents' | 'family';
    usedBytes?: number;
    color?: string;
}

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    activeVaultId: string;
    vaults: VaultInfo[];
    onSelectVault: (vaultId: string) => void;
    onCreateVaultClick: () => void;
    onStorageClick: () => void;
    onSecurityClick: () => void;
    uploadsCount: number;
    trashCount: number;
    usedStorageGB: number;
    totalStorageGB: number;
    isOpen?: boolean;
    onClose?: () => void;
}

const TeleGphotoLogoIcon = () => (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer lens ring */}
        <circle cx="16" cy="16" r="14" stroke="#FFC928" strokeWidth="2" fill="none" opacity="0.9" />
        {/* Inner lens circle */}
        <circle cx="16" cy="16" r="9" stroke="#FFC928" strokeWidth="1.5" fill="rgba(255,201,40,0.08)" />
        {/* Lens center dot */}
        <circle cx="16" cy="16" r="4" fill="#FFC928" />
        {/* Lens flare highlight */}
        <circle cx="12" cy="12" r="2" fill="#FFC928" opacity="0.4" />
        {/* Camera body top */}
        <rect x="10" y="3" width="12" height="4" rx="2" fill="#FFC928" opacity="0.7" />
    </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    activeVaultId,
    vaults,
    onSelectVault,
    onCreateVaultClick,
    onStorageClick,
    onSecurityClick,
    uploadsCount,
    trashCount,
    usedStorageGB,
    totalStorageGB,
    isOpen,
    onClose,
}) => {
    const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false);

    const activeVault = vaults.find(v => v.id === activeVaultId) || {
        id: 'default',
        name: 'Personal Vault',
        chatId: '',
        type: 'photos',
    };

    const storagePercent = Math.min(100, Math.round((usedStorageGB / totalStorageGB) * 100));

    const handleNavClick = (tabName: string) => {
        setActiveTab(tabName);
        onClose?.();
    };

    return (
        <>
            {isOpen && <div className="sidebar-mobile-backdrop" onClick={onClose} />}
            <aside className={`tg-sidebar ${isOpen ? 'mobile-open' : ''}`}>
                {/* Brand Header */}
                <div className="sidebar-brand-header">
                    <div className="brand-logo-group">
                        <TeleGphotoLogoIcon />
                        <div className="brand-text-block">
                            <h1 className="brand-name">TeleGphoto</h1>
                            <span className="brand-tagline">Your Private Media Cloud</span>
                        </div>
                    </div>
                    {onClose && (
                        <button className="sidebar-mobile-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Vault Selector Card with Floating Switcher */}
                <div className="vault-selector-wrapper">
                    <button
                        className={`vault-selector-card ${vaultDropdownOpen ? 'active-open' : ''}`}
                        onClick={() => setVaultDropdownOpen(!vaultDropdownOpen)}
                    >
                        <div className="vault-avatar-icon">
                            <div className="avatar-circle">
                                <span>{activeVault.name.charAt(0)}</span>
                            </div>
                        </div>
                        <div className="vault-meta-info">
                            <span className="vault-current-name">{activeVault.name}</span>
                            <span className="vault-storage-subtitle">
                                {usedStorageGB > 1000 ? `${(usedStorageGB / 1024).toFixed(2)} TB` : `${usedStorageGB.toFixed(1)} GB`} used
                            </span>
                        </div>
                        <ChevronDown size={18} className={`vault-chevron ${vaultDropdownOpen ? 'rotated' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {vaultDropdownOpen && (
                            <motion.div
                                className="vault-dropdown-menu"
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="vault-dropdown-header">
                                    <span>YOUR VAULTS</span>
                                </div>
                                <div className="vault-list-scroll">
                                    {vaults.map((vault) => (
                                        <button
                                            key={vault.id}
                                            className={`vault-item-option ${vault.id === activeVaultId ? 'selected' : ''}`}
                                            onClick={() => {
                                                onSelectVault(vault.id);
                                                setVaultDropdownOpen(false);
                                            }}
                                        >
                                            <div className="vault-option-dot" />
                                            <span className="vault-option-name">{vault.name}</span>
                                            {vault.id === activeVaultId && (
                                                <span className="vault-active-pill">Active</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="vault-dropdown-divider" />
                                <button
                                    className="vault-create-action-btn"
                                    onClick={() => {
                                        setVaultDropdownOpen(false);
                                        onCreateVaultClick();
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Create New Vault</span>
                                </button>
                                <button
                                    className="vault-manage-action-btn"
                                    onClick={() => {
                                        setVaultDropdownOpen(false);
                                        setActiveTab('Vaults');
                                    }}
                                >
                                    <Layers size={16} />
                                    <span>Manage Vaults</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Sections */}
                <div className="sidebar-nav-scroll-area">
                    <nav className="sidebar-nav-group primary-nav">
                        <button
                            className={`nav-item ${activeTab === 'Photos' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Photos')}
                        >
                            <Image size={19} />
                            <span className="nav-label">Photos</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Albums' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Albums')}
                        >
                            <Folder size={19} />
                            <span className="nav-label">Albums</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Memories' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Memories')}
                        >
                            <Sparkles size={19} />
                            <span className="nav-label">Memories</span>
                            <span className="nav-badge-pill yellow-new">New</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Favorites' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Favorites')}
                        >
                            <Star size={19} />
                            <span className="nav-label">Favorites</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Smart Collections' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Smart Collections')}
                        >
                            <LayoutGrid size={19} />
                            <span className="nav-label">Smart Collections</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Search' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Search')}
                        >
                            <Search size={19} />
                            <span className="nav-label">Search</span>
                        </button>
                    </nav>

                    <div className="nav-section-divider" />

                    {/* Secondary Navigation */}
                    <nav className="sidebar-nav-group secondary-nav">
                        <button
                            className={`nav-item ${activeTab === 'Uploads' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Uploads')}
                        >
                            <UploadCloud size={19} />
                            <span className="nav-label">Uploads</span>
                            {uploadsCount > 0 && (
                                <span className="nav-counter-badge yellow-count">{uploadsCount}</span>
                            )}
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Trash' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Trash')}
                        >
                            <Trash2 size={19} />
                            <span className="nav-label">Trash</span>
                            {trashCount > 0 && (
                                <span className="nav-counter-badge yellow-count">{trashCount}</span>
                            )}
                        </button>
                    </nav>

                    <div className="nav-section-divider" />

                    {/* System Navigation */}
                    <nav className="sidebar-nav-group system-nav">
                        <button
                            className={`nav-item ${activeTab === 'Activity' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Activity')}
                        >
                            <Activity size={19} />
                            <span className="nav-label">Activity</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Vaults' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Vaults')}
                        >
                            <Shield size={19} />
                            <span className="nav-label">Vaults</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'App Lock' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('App Lock')}
                        >
                            <Lock size={19} />
                            <span className="nav-label">App Lock</span>
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'Settings' ? 'active-pill' : ''}`}
                            onClick={() => handleNavClick('Settings')}
                        >
                            <Settings size={19} />
                            <span className="nav-label">Settings</span>
                        </button>
                    </nav>
                </div>

                {/* Footer Status Cards */}
                <div className="sidebar-footer-cards">
                    {/* Storage Card */}
                    <div className="sidebar-footer-card storage-card" onClick={onStorageClick}>
                        <div className="footer-card-header">
                            <span className="footer-card-title">Storage</span>
                        </div>
                        <div className="storage-usage-text">
                            {usedStorageGB > 1000 ? `${(usedStorageGB / 1024).toFixed(2)} TB` : `${usedStorageGB.toFixed(1)} GB`} / Unlimited
                        </div>
                        <div className="storage-progress-bar">
                            <div
                                className="storage-progress-fill"
                                style={{ width: `${storagePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Encryption & Security Card */}
                    <div className="sidebar-footer-card security-card" onClick={onSecurityClick}>
                        <div className="security-card-header">
                            <span className="security-status-title">Encrypted & Private</span>
                            <div className="security-lock-icon">
                                <Lock size={15} color="#FFC928" />
                            </div>
                        </div>
                        <p className="security-status-desc">
                            Zero-knowledge. Only you can access your data.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
