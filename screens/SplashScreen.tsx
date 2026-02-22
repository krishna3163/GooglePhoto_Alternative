import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const SPLASH_VIDEOS = [
    require('../assets/Animate_this_logo_1080p_202602211456.mp4'),
    require('../assets/Animate_this_logo_202602211456_85zmz.mp4'),
    require('../assets/Animate_this_logo_202602211456_i9prb.mp4'),
];

interface SplashScreenProps {
    onComplete: () => void;
    duration?: number;
}

export default function SplashScreen({ onComplete, duration = 5000 }: SplashScreenProps) {
    const [selectedVideo] = useState(() => 
        SPLASH_VIDEOS[Math.floor(Math.random() * SPLASH_VIDEOS.length)]
    );
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsLoaded(true);
        }

        // Auto-complete after video finishes or max duration
        if (status.isLoaded && status.didJustFinish) {
            onComplete();
        }
    };

    const { width, height } = Dimensions.get('window');

    return (
        <View style={styles.container}>
            <Video
                source={selectedVideo}
                style={{ width, height }}
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                shouldPlay={true}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
            {!isLoaded && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
});
