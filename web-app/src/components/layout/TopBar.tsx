import React, { useState, useRef, useEffect } from 'react';
import {
    Search,
    Filter,
    Upload,
    Sun,
    Moon,
    Bell,
    Shield,
    Lock,
    Settings,
    LogOut,
    Menu,
    X,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SyncStatusIndicator from '../sync/SyncStatusIndicator';
import './TopBar.css';

export interface FilterState {
    mediaType: 'all' | 'image' | 'video' | 'document';
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    favoritesOnly: boolean;
    category?: string;
}

interface TopBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onUploadClick: () => void;
    onMobileMenuClick: () => void;
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    userName: string;
    userPhotoUrl?: string;
    onOpenSettings: () => void;
    onOpenStorage: () => void;
    onOpenSecurity: () => void;
    onLockApp: () => void;
    onSignOut: () => void;
    notifications: { id: string; title: string; desc: string; time: string; unread: boolean }[];
    onClearNotifications: () => void;
    searchInputRef?: React.RefObject<HTMLInputElement | null>;
    syncStatus?: 'synced' | 'syncing' | 'failed' | 'offline' | 'uninitialized';
    syncPendingCount?: number;
    lastSyncedText?: string;
    onOpenSyncActivity?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onUploadClick,
    onMobileMenuClick,
    theme,
    onThemeToggle,
    userName,
    userPhotoUrl,
    onOpenSettings,
    onOpenStorage,
    onOpenSecurity,
    onLockApp,
    onSignOut,
    notifications,
    onClearNotifications,
    searchInputRef,
    syncStatus = 'synced',
    syncPendingCount = 0,
    lastSyncedText,
    onOpenSyncActivity,
}) => {
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const filterRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close popups on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => n.unread).length;

    const hasActiveFilters =
        filters.mediaType !== 'all' ||
        filters.dateRange !== 'all' ||
        filters.favoritesOnly ||
        !!filters.category;

    return (
        <header className="tg-topbar">
            {/* Mobile Hamburger */}
            <button className="mobile-menu-btn" onClick={onMobileMenuClick} aria-label="Open menu">
                <Menu size={22} />
            </button>

            {/* Center Search Input */}
            <div className="topbar-search-wrapper">
                <div className="search-input-box">
                    <Search size={18} className="search-box-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search your photos..."
                        className="search-text-input"
                    />
                    {searchQuery ? (
                        <button className="search-clear-btn" onClick={() => onSearchChange('')}>
                            <X size={16} />
                        </button>
                    ) : (
                        <span className="search-shortcut-badge">Ctrl K</span>
                    )}
                </div>

                {/* Filter Popover Button */}
                <div className="filter-dropdown-container" ref={filterRef}>
                    <button
                        className={`topbar-icon-action-btn ${hasActiveFilters ? 'active-filter-btn' : ''}`}
                        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                        title="Search Filters"
                    >
                        <Filter size={18} />
                    </button>

                    <AnimatePresence>
                        {filterDropdownOpen && (
                            <motion.div
                                className="filter-popover-card"
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="filter-popover-header">
                                    <h4>Filter Photos</h4>
                                    {hasActiveFilters && (
                                        <button
                                            className="filter-reset-link"
                                            onClick={() =>
                                                onFiltersChange({
                                                    mediaType: 'all',
                                                    dateRange: 'all',
                                                    favoritesOnly: false,
                                                })
                                            }
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="filter-section">
                                    <label>Media Type</label>
                                    <div className="filter-chip-group">
                                        {(['all', 'image', 'video', 'document'] as const).map(type => (
                                            <button
                                                key={type}
                                                className={`filter-chip ${filters.mediaType === type ? 'selected' : ''}`}
                                                onClick={() => onFiltersChange({ ...filters, mediaType: type })}
                                            >
                                                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="filter-section">
                                    <label>Date</label>
                                    <div className="filter-chip-group">
                                        {(['all', 'today', 'week', 'month', 'year'] as const).map(range => (
                                            <button
                                                key={range}
                                                className={`filter-chip ${filters.dateRange === range ? 'selected' : ''}`}
                                                onClick={() => onFiltersChange({ ...filters, dateRange: range })}
                                            >
                                                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="filter-section">
                                    <label>Favorites</label>
                                    <button
                                        className={`filter-chip ${filters.favoritesOnly ? 'selected' : ''}`}
                                        onClick={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
                                    >
                                        ⭐ Starred Only
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Cloud Sync Status Indicator */}
                {onOpenSyncActivity && (
                    <SyncStatusIndicator
                        status={syncStatus}
                        pendingCount={syncPendingCount}
                        lastSyncedText={lastSyncedText}
                        onClick={onOpenSyncActivity}
                    />
                )}

                {/* Upload Button */}
                <button className="topbar-yellow-upload-btn" onClick={onUploadClick}>
                    <Upload size={18} />
                    <span>Upload</span>
                </button>
            </div>

            {/* Right Tools Area */}
            <div className="topbar-right-tools">
                {/* Theme Toggle */}
                <button className="topbar-tool-icon-btn" onClick={onThemeToggle} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
                </button>

                {/* Notifications Bell */}
                <div className="notif-dropdown-container" ref={notifRef}>
                    <button
                        className="topbar-tool-icon-btn notif-btn"
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        title="Notifications"
                    >
                        <Bell size={19} />
                        {unreadCount > 0 && <span className="notif-unread-dot" />}
                    </button>

                    <AnimatePresence>
                        {notificationsOpen && (
                            <motion.div
                                className="notif-popover-card"
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="notif-card-header">
                                    <h4>Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button className="notif-clear-btn" onClick={onClearNotifications}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="notif-list-scroll">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty-state">
                                            <span>No new notifications</span>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`notif-item-row ${n.unread ? 'unread' : ''}`}>
                                                <div className="notif-indicator-dot" />
                                                <div className="notif-content">
                                                    <h5>{n.title}</h5>
                                                    <p>{n.desc}</p>
                                                    <span className="notif-time">{n.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Avatar Menu */}
                <div className="profile-menu-container" ref={profileRef}>
                    <button
                        className="topbar-avatar-btn"
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        title={userName}
                    >
                        {userPhotoUrl ? (
                            <img src={userPhotoUrl} alt={userName} className="avatar-img" />
                        ) : (
                            <div className="avatar-fallback">{userName.charAt(0).toUpperCase()}</div>
                        )}
                    </button>

                    <AnimatePresence>
                        {profileMenuOpen && (
                            <motion.div
                                className="profile-dropdown-card"
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="profile-user-info-row">
                                    <div className="profile-large-avatar">{userName.charAt(0).toUpperCase()}</div>
                                    <div className="profile-name-group">
                                        <h4>{userName}</h4>
                                        <span>Personal Account</span>
                                    </div>
                                </div>

                                <div className="profile-menu-divider" />

                                <button
                                    className="profile-menu-item"
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        onOpenStorage();
                                    }}
                                >
                                    <Layers size={16} />
                                    <span>Storage Management</span>
                                </button>

                                <button
                                    className="profile-menu-item"
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        onOpenSecurity();
                                    }}
                                >
                                    <Shield size={16} />
                                    <span>Security & Privacy</span>
                                </button>

                                <button
                                    className="profile-menu-item"
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        onOpenSettings();
                                    }}
                                >
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </button>

                                <div className="profile-menu-divider" />

                                <button
                                    className="profile-menu-item lock-item"
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        onLockApp();
                                    }}
                                >
                                    <Lock size={16} color="#FFC928" />
                                    <span>Lock App Now</span>
                                </button>

                                <button
                                    className="profile-menu-item signout-item"
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        onSignOut();
                                    }}
                                >
                                    <LogOut size={16} color="#FF5C6C" />
                                    <span>Sign Out</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
