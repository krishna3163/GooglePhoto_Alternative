import React, { useRef } from 'react';
import type { MemoryHighlight } from '../../intelligence/types';
import { Sparkles, ChevronRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import './MemoriesBanner.css';

interface MemoriesBannerProps {
    memories: MemoryHighlight[];
    onOpenMemoryStory: (memory: MemoryHighlight) => void;
    onViewAllMemories: () => void;
}

export const MemoriesBanner: React.FC<MemoriesBannerProps> = ({
    memories,
    onOpenMemoryStory,
    onViewAllMemories,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    if (memories.length === 0) return null;

    const handleScrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    return (
        <div className="memories-section-wrapper">
            {/* Header */}
            <div className="memories-section-header">
                <div className="memories-section-title">
                    <Sparkles size={18} className="memories-sparkle-icon" />
                    <span>Memories</span>
                </div>
                <button className="memories-view-all-link" onClick={onViewAllMemories}>
                    <span>View all</span>
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* Carousel Row */}
            <div className="memories-carousel-track-wrapper">
                <div className="memories-cards-scroll-track" ref={scrollContainerRef}>
                    {memories.map((memory) => (
                        <motion.div
                            key={memory.id}
                            className="memory-story-card"
                            whileHover={{ scale: 1.025, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onOpenMemoryStory(memory)}
                        >
                            <img
                                src={memory.coverPhoto.url}
                                alt={memory.title}
                                className="memory-card-bg-image"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=84';
                                }}
                            />

                            <div className="memory-card-badge-top">
                                <div className="memory-pill-icon">
                                    <Layers size={13} />
                                </div>
                            </div>
                            <div className="memory-card-bottom-scrim">
                                <h4 className="memory-headline">{memory.title}</h4>
                                <span className="memory-subheadline">
                                    {memory.dateDescription} {memory.yearDiff ? `• ${memory.yearDiff} year${memory.yearDiff > 1 ? 's' : ''} ago` : ''}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {memories.length > 3 && (
                    <button
                        className="memories-carousel-nav-btn right"
                        onClick={handleScrollRight}
                        aria-label="Scroll memories right"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MemoriesBanner;
