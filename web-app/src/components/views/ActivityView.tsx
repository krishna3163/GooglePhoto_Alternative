import React from 'react';
import { Activity, UploadCloud, FolderPlus, Shield, RefreshCw, Copy, Trash2 } from 'lucide-react';
import './ActivityView.css';

export interface ActivityEvent {
    id: string;
    type: 'upload' | 'album' | 'vault' | 'restore' | 'duplicate' | 'trash';
    title: string;
    desc: string;
    timestamp: string;
}

interface ActivityViewProps {
    activities: ActivityEvent[];
}

const ActivityView: React.FC<ActivityViewProps> = ({ activities }) => {
    const getIcon = (type: ActivityEvent['type']) => {
        switch (type) {
            case 'upload': return <UploadCloud size={17} color="#FFC928" />;
            case 'album': return <FolderPlus size={17} color="#38BDF8" />;
            case 'vault': return <Shield size={17} color="#3DDC97" />;
            case 'restore': return <RefreshCw size={17} color="#3DDC97" />;
            case 'duplicate': return <Copy size={17} color="#FFC928" />;
            case 'trash': return <Trash2 size={17} color="#FF5C6C" />;
        }
    };

    return (
        <div className="activity-main-page">
            <div className="activity-page-header">
                <div className="activity-title-block">
                    <h2>Activity Timeline</h2>
                    <span>Local audit history of library actions and cryptographic events</span>
                </div>
            </div>

            {activities.length === 0 ? (
                <div className="activity-empty-state">
                    <Activity size={54} color="#FFC928" />
                    <h3>No recent activity</h3>
                    <p>Your library operations will be securely logged here on-device.</p>
                </div>
            ) : (
                <div className="activity-timeline-list">
                    {activities.map((act) => (
                        <div key={act.id} className="activity-item-card">
                            <div className="activity-icon-wrap">
                                {getIcon(act.type)}
                            </div>
                            <div className="activity-content-block">
                                <div className="activity-top-row">
                                    <h4>{act.title}</h4>
                                    <span className="activity-time-str">
                                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p>{act.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityView;
