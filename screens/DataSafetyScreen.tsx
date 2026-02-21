import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { ShieldAlert, Share2, Server } from 'lucide-react-native';

export default function DataSafetyScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.heading, { color: theme.text }]}>Data Safety</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.cardHeader}>
                    <ShieldAlert size={24} color={theme.tint} />
                    <Text style={[styles.title, { color: theme.text }]}>What data is collected?</Text>
                </View>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    - Photos (for backup)
                    {'\n'}- Videos (for backup)
                    {'\n'}- Documents (you explicitly upload)
                    {'\n'}- OCR Text (processed locally)
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.cardHeader}>
                    <Server size={24} color={theme.tint} />
                    <Text style={[styles.title, { color: theme.text }]}>Where is it stored?</Text>
                </View>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    All data is stored exclusively in your own Telegram cloud storage account.
                    {'\n'}We do not transmit your files to any other server.
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.cardHeader}>
                    <Share2 size={24} color={theme.tint} />
                    <Text style={[styles.title, { color: theme.text }]}>Is data shared?</Text>
                </View>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    No. The developer does not have access to your files.
                    {'\n'}No persistent data is shared with third parties for tracking or ads.
                </Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 32,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginLeft: 4,
    },
});
