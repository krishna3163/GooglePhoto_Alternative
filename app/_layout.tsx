import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { initDatabase } from '../database/db';
import { registerBackgroundSync } from '../services/backgroundSync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Initialize database on app start
        initDatabase()
            .catch(e => console.error("DB Init error", e));

        // Register background sync task
        registerBackgroundSync()
            .catch(e => console.error("BG Task error", e));

        // Check First Run
        checkFirstRun();
    }, []);

    const checkFirstRun = async () => {
        try {
            const permissionIntroShown = await AsyncStorage.getItem('permissionIntroShown');
            const privacyAccepted = await AsyncStorage.getItem('privacyAccepted');
            const disclaimerAccepted = await AsyncStorage.getItem('disclaimerAccepted');

            if (permissionIntroShown !== 'true') {
                router.replace('/permission-intro');
            } else if (privacyAccepted !== 'true') {
                router.replace('/privacy-policy-intro');
            } else if (disclaimerAccepted !== 'true') {
                router.replace('/disclaimer');
            }
        } catch (e) {
            console.error("AsyncStorage error", e);
        } finally {
            setIsLoaded(true);
        }
    };

    if (!isLoaded) {
        return null; // Or a Splash component
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
            </Stack>
        </ThemeProvider>
    );
}
