import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutGrid,
    List,
    Layers,
    ChevronDown,
    ArrowUpDown,
    Calendar,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './GalleryToolbar.css';

export type ViewMode = 'grid' | 'list' | 'masonry';
export type SortField = 'dateAdded' | 'dateTaken' | 'fileName' | 'fileSize';
export type SortDirection = 'desc' | 'asc';

interface GalleryToolbarProps {
    dateLabel: string;
    totalCount: number;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    sortField: SortField;
    onSortFieldChange: (field: SortField) => void;
    sortDirection: SortDirection;
    onSortDirectionToggle: () => void;
    onJumpToDate?: (date: string) => void;
}

const GalleryToolbar: React.FC<GalleryToolbarProps> = ({
    dateLabel,
    totalCount,
    viewMode,
    onViewModeChange,
    sortField,
    onSortFieldChange,
    sortDirection,
    onSortDirectionToggle,
    onJumpToDate,
}) => {
    const [dateMenuOpen, setDateMenuOpen] = useState(false);
    const [sortMenuOpen, setSortMenuOpen] = useState(false);

    const dateMenuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
                setDateMenuOpen(false);
            }
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
                setSortMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortLabels: Record<SortField, string> = {
        dateAdded: 'Date added',
        dateTaken: 'Date taken',
        fileName: 'Name',
        fileSize: 'File size',
    };

    return (
        <div className="gallery-toolbar-container">
            {/* Left: Date Group Dropdown */}
            <div className="toolbar-date-dropdown-wrapper" ref={dateMenuRef}>
                <button
                    className={`toolbar-date-btn ${dateMenuOpen ? 'active' : ''}`}
                    onClick={() => setDateMenuOpen(!dateMenuOpen)}
                >
                    <span className="toolbar-date-title">{dateLabel || 'All Photos'}</span>
                    <span className="toolbar-item-count">{totalCount} items</span>
                    <ChevronDown size={16} className={`chevron-icon ${dateMenuOpen ? 'rotated' : ''}`} />
                </button>

                <AnimatePresence>
                    {dateMenuOpen && (
                        <motion.div
                            className="toolbar-dropdown-menu date-menu"
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                        >
                            <button
                                className="toolbar-dropdown-item"
                                onClick={() => {
                                    onJumpToDate?.('today');
                                    setDateMenuOpen(false);
                                }}
                            >
                                <Calendar size={15} />
                                <span>Today</span>
                            </button>
                            <button
                                className="toolbar-dropdown-item"
                                onClick={() => {
                                    onJumpToDate?.('month');
                                    setDateMenuOpen(false);
                                }}
                            >
                                <Calendar size={15} />
                                <span>This Month</span>
                            </button>
                            <button
                                className="toolbar-dropdown-item"
                                onClick={() => {
                                    onJumpToDate?.('year');
                                    setDateMenuOpen(false);
                                }}
                            >
                                <Calendar size={15} />
                                <span>This Year</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Center: View Switcher (Grid / List / Masonry) */}
            <div className="toolbar-view-switcher">
                <button
                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('grid')}
                    title="Grid View"
                >
                    <LayoutGrid size={17} />
                </button>

                <button
                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('list')}
                    title="List View"
                >
                    <List size={17} />
                </button>

                <button
                    className={`view-toggle-btn ${viewMode === 'masonry' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('masonry')}
                    title="Masonry View"
                >
                    <Layers size={17} />
                </button>
            </div>

            {/* Right: Sort Dropdown & Order Toggle */}
            <div className="toolbar-right-sort-group">
                <div className="toolbar-sort-dropdown-wrapper" ref={sortMenuRef}>
                    <button
                        className="toolbar-sort-btn"
                        onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    >
                        <span>Sort by: <b>{sortLabels[sortField]}</b></span>
                        <ChevronDown size={15} className={`chevron-icon ${sortMenuOpen ? 'rotated' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {sortMenuOpen && (
                            <motion.div
                                className="toolbar-dropdown-menu sort-menu"
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                            >
                                {(Object.keys(sortLabels) as SortField[]).map(field => (
                                    <button
                                        key={field}
                                        className={`toolbar-dropdown-item ${sortField === field ? 'selected' : ''}`}
                                        onClick={() => {
                                            onSortFieldChange(field);
                                            setSortMenuOpen(false);
                                        }}
                                    >
                                        <span>{sortLabels[field]}</span>
                                        {sortField === field && <Check size={14} color="#FFC928" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    className="toolbar-order-toggle-btn"
                    onClick={onSortDirectionToggle}
                    title={sortDirection === 'desc' ? 'Newest first (click for oldest)' : 'Oldest first (click for newest)'}
                >
                    <ArrowUpDown size={16} />
                </button>
            </div>
        </div>
    );
};

export default GalleryToolbar;
