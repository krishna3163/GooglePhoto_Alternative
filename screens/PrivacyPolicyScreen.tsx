import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, StatusBar } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const pathname = usePathname();

    // If param is set, calculate mode. Else derive from path.
    const mode = params.mode || (pathname && pathname.includes('view') ? 'view' : 'onboarding');

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleAgree = async () => {
        if (mode === 'view') {
            router.back();
            return;
        }

        // Set privacy accepted flag
        await AsyncStorage.setItem('privacyAccepted', 'true');
        // Navigate to disclaimer (replace current stack)
        router.replace('/disclaimer');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.paragraph, { color: theme.text }]}>
                    TelePhoto Cloud does not store user data on any developer-controlled servers.
                </Text>

                <Text style={[styles.paragraph, { color: theme.text }]}>
                    All photos, videos, and documents are uploaded directly to the user’s own Telegram account using the Telegram Bot API.
                </Text>

                <Text style={[styles.paragraph, { color: theme.text }]}>
                    No files are transmitted to or stored on any third-party servers controlled by the developer.
                </Text>

                <Text style={[styles.paragraph, { color: theme.text }]}>
                    The app only accesses media files required for backup functionality.
                </Text>

                <Text style={[styles.subtitle, { color: theme.text }]}>User Control</Text>
                <Text style={[styles.paragraph, { color: theme.text }]}>
                    Users have full control over:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={[styles.bullet, { color: theme.text }]}>- Auto backup settings</Text>
                    <Text style={[styles.bullet, { color: theme.text }]}>- Folder selection</Text>
                    <Text style={[styles.bullet, { color: theme.text }]}>- Sync options</Text>
                </View>

                <Text style={[styles.paragraph, { color: theme.text }]}>
                    Backup features can be disabled at any time in Settings.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                    onPress={handleAgree}
                >
                    <Text style={styles.primaryButtonText}>{mode === 'view' ? 'Close' : 'I Agree'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 24,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    bulletList: {
        marginLeft: 8,
        marginBottom: 16,
    },
    bullet: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 4,
    },
    footer: {
        padding: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: '#ccc',
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
