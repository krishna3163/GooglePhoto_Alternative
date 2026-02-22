import {
    Image,
    Folder,
    FileText,
    MonitorPlay,
    Star,
    Users,
    MapPin,
    Video,
    Clock,
    ChevronDown,
    MessageSquare,
    Send
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isDeveloperMode?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isDeveloperMode, isOpen, onClose }) => {
    const handleItemClick = (tab: string) => {
        setActiveTab(tab);
        onClose?.();
    };
    const menuItems = [
        { icon: <Image size={20} />, label: 'Photos' },
        { icon: <Clock size={20} />, label: 'Recently added' },
        { icon: <MessageSquare size={20} />, label: 'Messages' },
        ...(isDeveloperMode ? [{ icon: <Send size={20} />, label: 'Telegram' }] : []),
    ];

    const collectionItems = [
        { icon: <Folder size={20} />, label: 'Albums' },
        { icon: <FileText size={20} />, label: 'Documents' },
        { icon: <MonitorPlay size={20} />, label: 'Screenshots and recordings' },
        { icon: <Star size={20} />, label: 'Favourites' },
    ];

    const moreItems = [
        { icon: <Users size={20} />, label: 'People' },
        { icon: <MapPin size={20} />, label: 'Places' },
        { icon: <Video size={20} />, label: 'Videos' },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
            <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
                <div className="sidebar-section">
                    {menuItems.map((item) => (
                        <div
                            key={item.label}
                            className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => handleItemClick(item.label)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="sidebar-group">
                    <div className="sidebar-group-header">
                        <span>Collections</span>
                        <ChevronDown size={16} />
                    </div>
                    {collectionItems.map((item) => (
                        <div
                            key={item.label}
                            className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => handleItemClick(item.label)}
                        >
                            <div className="indent" />
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="sidebar-section">
                    {moreItems.map((item) => (
                        <div
                            key={item.label}
                            className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => handleItemClick(item.label)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
