
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, StatusBar, Linking } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DisclaimerScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const mode = params.mode;

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleContinue = async () => {
        if (mode === 'view') {
            router.back();
            return;
        }
        await AsyncStorage.setItem('disclaimerAccepted', 'true');
        // Navigate to main app (replace current stack)
        router.replace('/');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Disclaimer</Text>

                <View style={styles.card}>
                    <Text style={[styles.text, { color: theme.text }]}>
                        TelePhoto Cloud is an independent application and is not affiliated with or endorsed by Telegram.
                    </Text>

                    <Text style={[styles.text, { color: theme.text, marginTop: 16 }]}>
                        All files are stored in the user’s own Telegram account using the Telegram Bot API.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                    onPress={handleContinue}
                >
                    <Text style={styles.primaryButtonText}>{mode === 'view' ? 'Close' : 'Continue'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 32,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: 'rgba(128,128,128,0.1)',
        width: '100%',
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    footer: {
        paddingBottom: 20,
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
