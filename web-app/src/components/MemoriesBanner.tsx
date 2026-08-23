import React, { useState, useEffect } from 'react';
import type { MemoryHighlight } from '../intelligence/types';
import type { PhotoAsset } from '../types';
import { Sparkles, X, ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MemoriesBanner.css';

interface MemoriesBannerProps {
    memories: MemoryHighlight[];
    onPhotoClick: (photo: PhotoAsset) => void;
    onHideMemory?: (memoryId: string) => void;
}

const MemoriesBanner: React.FC<MemoriesBannerProps> = ({ memories, onPhotoClick, onHideMemory }) => {
    const [activeStory, setActiveStory] = useState<MemoryHighlight | null>(null);
    const [storyPhotoIndex, setStoryPhotoIndex] = useState(0);

    // Auto-advance story timer
    useEffect(() => {
        if (!activeStory) return;
        const timer = setTimeout(() => {
            if (storyPhotoIndex < activeStory.photos.length - 1) {
                setStoryPhotoIndex(prev => prev + 1);
            } else {
                setActiveStory(null);
                setStoryPhotoIndex(0);
            }
        }, 4500);

        return () => clearTimeout(timer);
    }, [activeStory, storyPhotoIndex]);

    if (memories.length === 0) return null;

    const handleOpenStory = (memory: MemoryHighlight) => {
        setActiveStory(memory);
        setStoryPhotoIndex(0);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (storyPhotoIndex > 0) {
            setStoryPhotoIndex(prev => prev - 1);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeStory && storyPhotoIndex < activeStory.photos.length - 1) {
            setStoryPhotoIndex(prev => prev + 1);
        } else {
            setActiveStory(null);
        }
    };

    return (
        <>
            <div className="memories-carousel-container">
                <div className="memories-header">
                    <div className="memories-title">
                        <Sparkles size={18} className="sparkle-icon" />
                        <span>Memories</span>
                    </div>
                </div>

                <div className="memories-scroll-row">
                    {memories.map(memory => (
                        <motion.div
                            key={memory.id}
                            className="memory-card"
                            whileHover={{ scale: 1.03, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOpenStory(memory)}
                        >
                            <img
                                src={memory.coverPhoto.url}
                                alt={memory.title}
                                className="memory-card-img"
                                loading="lazy"
                            />
                            <div className="memory-card-overlay">
                                <span className="memory-card-pill">{memory.dateDescription}</span>
                                <h4 className="memory-card-title">{memory.title}</h4>
                                <span className="memory-card-count">{memory.subtitle}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Fullscreen Story Viewer Modal */}
            <AnimatePresence>
                {activeStory && (
                    <motion.div
                        className="story-viewer-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="story-progress-bar-container">
                            {activeStory.photos.map((_, idx) => (
                                <div key={idx} className="story-progress-track">
                                    <div
                                        className={`story-progress-fill ${
                                            idx < storyPhotoIndex
                                                ? 'completed'
                                                : idx === storyPhotoIndex
                                                ? 'active'
                                                : ''
                                        }`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="story-viewer-header">
                            <div className="story-meta">
                                <h3>{activeStory.title}</h3>
                                <p>{activeStory.photos[storyPhotoIndex]?.fileName}</p>
                            </div>
                            <div className="story-actions">
                                {onHideMemory && (
                                    <button
                                        className="story-icon-btn"
                                        title="Hide this memory"
                                        onClick={() => {
                                            onHideMemory(activeStory.id);
                                            setActiveStory(null);
                                        }}
                                    >
                                        <EyeOff size={20} />
                                    </button>
                                )}
                                <button
                                    className="story-icon-btn"
                                    onClick={() => setActiveStory(null)}
                                    title="Close"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="story-content-area" onClick={() => onPhotoClick(activeStory.photos[storyPhotoIndex])}>
                            <button className="story-nav-btn prev" onClick={handlePrev} disabled={storyPhotoIndex === 0}>
                                <ChevronLeft size={28} />
                            </button>

                            <motion.img
                                key={activeStory.photos[storyPhotoIndex]?.id}
                                src={activeStory.photos[storyPhotoIndex]?.url}
                                alt="Memory item"
                                className="story-active-image"
                                initial={{ scale: 1.05, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            />

                            <button className="story-nav-btn next" onClick={handleNext}>
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MemoriesBanner;
