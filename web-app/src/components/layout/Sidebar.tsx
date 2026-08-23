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
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4C19.3137 4 22 6.68629 22 10C22 13.3137 19.3137 16 16 16C12.6863 16 10 13.3137 10 10C10 6.68629 12.6863 4 16 4Z" fill="#FF5C6C" />
        <path d="M28 16C28 19.3137 25.3137 22 22 22C18.6863 22 16 19.3137 16 16C16 12.6863 18.6863 10 22 10C25.3137 10 28 12.6863 28 16Z" fill="#FFC928" />
        <path d="M16 28C12.6863 28 10 25.3137 10 22C10 18.6863 12.6863 16 16 16C19.3137 16 22 18.6863 22 22C22 25.3137 19.3137 28 16 28Z" fill="#3DDC97" />
        <path d="M4 16C4 12.6863 6.68629 10 10 10C13.3137 10 16 12.6863 16 16C16 19.3137 13.3137 22 10 22C6.68629 22 4 19.3137 4 16Z" fill="#38BDF8" />
    </svg>
);

const Sidebar: React.FC<SidebarProps> = ({
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
                            {usedStorageGB > 1000 ? `${(usedStorageGB / 1024).toFixed(2)} TB` : `${usedStorageGB.toFixed(1)} GB`} / {totalStorageGB >= 1000 ? `${(totalStorageGB / 1024).toFixed(0)} TB` : `${totalStorageGB} GB`} ({storagePercent}%)
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
