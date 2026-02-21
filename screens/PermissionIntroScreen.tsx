import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, StatusBar } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { Check, ShieldCheck, Cloud } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PermissionIntroScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const mode = params.mode;

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const completeStep = async () => {
        if (mode === 'view') {
            router.back();
            return;
        }
        await AsyncStorage.setItem('permissionIntroShown', 'true');
        // Navigate to next step
        router.replace('/privacy-policy-intro');
    }

    const handleGrantAccess = async () => {
        if (mode === 'view') {
            router.back();
            return;
        }
        // Request permissions
        const permission = await MediaLibrary.requestPermissionsAsync();
        // Regardless of result, proceed
        await completeStep();
    };

    const handleContinueWithoutBackup = async () => {
        // Skip permission request
        await completeStep();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.background === '#000' ? '#333' : '#f0f0f0' }]}>
                    {/* App icon placeholder or Cloud icon */}
                    <Cloud size={64} color={theme.tint} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>Media Access Required</Text>

                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    This app needs access to your photos and videos to back them up to your Telegram cloud.
                </Text>

                <View style={styles.bulletList}>
                    <View style={styles.bulletItem}>
                        <Check size={20} color={theme.tint} />
                        <Text style={[styles.bulletText, { color: theme.text }]}>Only photos and videos are accessed</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <ShieldCheck size={20} color={theme.tint} />
                        <Text style={[styles.bulletText, { color: theme.text }]}>No files are stored on developer servers</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Cloud size={20} color={theme.tint} />
                        <Text style={[styles.bulletText, { color: theme.text }]}>Files are uploaded directly to your Telegram account</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                    onPress={handleGrantAccess}
                >
                    <Text style={styles.primaryButtonText}>{mode === 'view' ? 'Close' : 'Allow Access'}</Text>
                </TouchableOpacity>

                {mode !== 'view' && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleContinueWithoutBackup}
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Continue without backup</Text>
                    </TouchableOpacity>
                )}
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
    iconContainer: {
        marginBottom: 32,
        padding: 20,
        borderRadius: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    bulletList: {
        width: '100%',
        paddingHorizontal: 16,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    bulletText: {
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        paddingBottom: 20,
        gap: 16,
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
    secondaryButton: {
        padding: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
