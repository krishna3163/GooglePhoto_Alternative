import React from 'react';
import { Home, Search, Plus, Sparkles, LayoutGrid } from 'lucide-react';
import './MobileBottomNav.css';

interface MobileBottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onUploadClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeTab,
    onTabChange,
    onUploadClick,
}) => {
    return (
        <nav className="mobile-bottom-dock-wrapper">
            <div className="mobile-dock-pill">
                <button
                    className={`mobile-dock-item ${activeTab === 'Photos' ? 'active' : ''}`}
                    onClick={() => onTabChange('Photos')}
                >
                    <Home size={20} />
                    <span>Home</span>
                </button>

                <button
                    className={`mobile-dock-item ${activeTab === 'Search' ? 'active' : ''}`}
                    onClick={() => onTabChange('Search')}
                >
                    <Search size={20} />
                    <span>Search</span>
                </button>

                <button
                    className="mobile-dock-fab-upload"
                    onClick={onUploadClick}
                    aria-label="Upload photo"
                >
                    <Plus size={24} color="#080B10" strokeWidth={2.8} />
                </button>

                <button
                    className={`mobile-dock-item ${activeTab === 'Memories' ? 'active' : ''}`}
                    onClick={() => onTabChange('Memories')}
                >
                    <Sparkles size={20} />
                    <span>Memories</span>
                </button>

                <button
                    className={`mobile-dock-item ${activeTab === 'Albums' || activeTab === 'Smart Collections' ? 'active' : ''}`}
                    onClick={() => onTabChange('Albums')}
                >
                    <LayoutGrid size={20} />
                    <span>Library</span>
                </button>
            </div>
        </nav>
    );
};

export default MobileBottomNav;
