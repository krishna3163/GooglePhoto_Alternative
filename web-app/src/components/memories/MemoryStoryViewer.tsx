import React, { useState, useEffect } from 'react';
import type { MemoryHighlight } from '../../intelligence/types';
import type { PhotoAsset } from '../../types';
import { X, ChevronLeft, ChevronRight, EyeOff, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MemoryStoryViewer.css';

interface MemoryStoryViewerProps {
    memory: MemoryHighlight;
    onClose: () => void;
    onPhotoClick: (photo: PhotoAsset) => void;
    onHideMemory?: (memoryId: string) => void;
}

export const MemoryStoryViewer: React.FC<MemoryStoryViewerProps> = ({
    memory,
    onClose,
    onPhotoClick,
    onHideMemory,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const currentPhoto = memory.photos[currentIndex] || memory.coverPhoto;

    // Auto-advance timer
    useEffect(() => {
        if (isPaused) return;

        const timer = setTimeout(() => {
            if (currentIndex < memory.photos.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onClose();
            }
        }, 4500);

        return () => clearTimeout(timer);
    }, [currentIndex, isPaused, memory.photos.length, onClose]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                if (currentIndex < memory.photos.length - 1) setCurrentIndex(prev => prev + 1);
                else onClose();
            } else if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
            } else if (e.key === 'Escape') {
                onClose();
            } else if (e.key === ' ') {
                setIsPaused(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, memory.photos.length, onClose]);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex < memory.photos.length - 1) setCurrentIndex(prev => prev + 1);
        else onClose();
    };

    return (
        <div className="memory-story-overlay">
            {/* Top Progress Bars */}
            <div className="story-progress-container">
                {memory.photos.map((_, idx) => (
                    <div key={idx} className="story-progress-segment">
                        <div
                            className={`story-progress-value ${
                                idx < currentIndex
                                    ? 'finished'
                                    : idx === currentIndex && !isPaused
                                    ? 'active-progress'
                                    : ''
                            }`}
                        />
                    </div>
                ))}
            </div>

            {/* Story Header */}
            <div className="story-header-bar">
                <div className="story-header-meta">
                    <h3>{memory.title}</h3>
                    <span>{memory.dateDescription} • {currentIndex + 1} of {memory.photos.length}</span>
                </div>

                <div className="story-header-controls">
                    <button
                        className="story-control-btn"
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? 'Resume autoplay' : 'Pause'}
                    >
                        {isPaused ? <Play size={18} /> : <Pause size={18} />}
                    </button>

                    {onHideMemory && (
                        <button
                            className="story-control-btn"
                            onClick={() => {
                                onHideMemory(memory.id);
                                onClose();
                            }}
                            title="Hide this memory"
                        >
                            <EyeOff size={18} />
                        </button>
                    )}

                    <button className="story-control-btn close-btn" onClick={onClose} title="Close story">
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Story Image Canvas */}
            <div className="story-canvas-area" onClick={() => onPhotoClick(currentPhoto)}>
                <button
                    className="story-arrow-btn left"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    aria-label="Previous"
                >
                    <ChevronLeft size={30} />
                </button>

                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentPhoto.id}
                        src={currentPhoto.url}
                        alt={currentPhoto.fileName}
                        className="story-rendered-image"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                </AnimatePresence>

                <button className="story-arrow-btn right" onClick={handleNext} aria-label="Next">
                    <ChevronRight size={30} />
                </button>
            </div>
        </div>
    );
};

export default MemoryStoryViewer;
