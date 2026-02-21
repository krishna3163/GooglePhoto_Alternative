import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme, Linking } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ExternalLink, BookOpen, User } from 'lucide-react-native';

export default function AboutScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={[styles.fallbackIcon, { backgroundColor: theme.card }]}> 
                    <Text style={{ color: theme.text, fontWeight: '700' }}>TP</Text>
                </View>
                <Text style={[styles.appName, { color: theme.text }]}>TelePhoto Cloud</Text>
                <Text style={[styles.version, { color: theme.textSecondary }]}>v1.0.0</Text>
            </View>

            <View style={styles.intro}>
                <Text style={[styles.description, { color: theme.text }]}>
                    This app uses Telegram as cloud storage.
                </Text>
                <Text style={[styles.description, { color: theme.text }]}>
                    All files are stored in your own Telegram account.
                </Text>
            </View>

            <View style={styles.links}>
                <TouchableOpacity style={[styles.link, { backgroundColor: theme.card }]} onPress={() => router.push('/privacy-policy-view')}>
                    <BookOpen size={20} color={theme.text} />
                    <Text style={[styles.linkText, { color: theme.text }]}>Privacy Policy</Text>
                    <ExternalLink size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.link, { backgroundColor: theme.card }]} onPress={() => router.push('/data-safety')}>
                    <User size={20} color={theme.text} />
                    <Text style={[styles.linkText, { color: theme.text }]}>Data Safety</Text>
                    <ExternalLink size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    Not affiliated with Telegram FZ-LLC.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
    version: {
        fontSize: 16,
        marginTop: 8,
    },
    intro: {
        marginBottom: 40,
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 8,
    },
    links: {
        width: '100%',
        gap: 16,
    },
    link: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 16,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 12,
    },
    fallbackIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
