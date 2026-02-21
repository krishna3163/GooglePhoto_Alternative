import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useColorScheme, Switch } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Settings, Cloud, Lock, Trash2, LogOut, HardDrive } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getStorageStats } from '../../database/db';
import { useState, useCallback } from 'react';

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [stats, setStats] = useState({ totalFiles: 0, photos: 0, videos: 0, docs: 0 });

    useFocusEffect(
        useCallback(() => {
            getStorageStats().then(setStats);
        }, [])
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Image
                    source={{ uri: 'https://i.pravatar.cc/300' }}
                    style={styles.avatar}
                />
                <Text style={[styles.name, { color: theme.text }]}>John Doe</Text>
                <Text style={[styles.email, { color: theme.textSecondary }]}>john.doe@example.com</Text>
            </View>

            <View style={[styles.backupCard, { backgroundColor: theme.card }]}>
                <View style={styles.backupHeader}>
                    <Cloud color={theme.tint} size={24} />
                    <Text style={[styles.backupTitle, { color: theme.text }]}>Backup is on</Text>
                </View>
                <Text style={[styles.backupStatus, { color: theme.textSecondary }]}>Backing up 1,234 items left</Text>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.tint, width: '45%' }]} />
                </View>
                <Text style={[styles.storageText, { color: theme.textSecondary }]}>{stats.totalFiles} items stored</Text>
            </View>

            <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.photos}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Photos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.videos}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Videos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.docs}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Docs</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Settings</Text>

                <TouchableOpacity
                    style={[styles.row, { borderBottomColor: theme.border }]}
                    onPress={() => router.push('/settings')}
                >
                    <View style={styles.rowIcon}>
                        <Settings color={theme.text} size={20} />
                    </View>
                    <Text style={[styles.rowText, { color: theme.text }]}>Settings / Telegram Backup</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
                    <View style={styles.rowIcon}>
                        <Lock color={theme.text} size={20} />
                    </View>
                    <Text style={[styles.rowText, { color: theme.text }]}>Locked Folder</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
                    <View style={styles.rowIcon}>
                        <Trash2 color={theme.destructive} size={20} />
                    </View>
                    <Text style={[styles.rowText, { color: theme.destructive }]}>Deleted Items</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.card }]}>
                <LogOut color={theme.destructive} size={20} />
                <Text style={[styles.logoutText, { color: theme.destructive }]}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
    },
    backupCard: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    backupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    backupTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    backupStatus: {
        fontSize: 14,
        marginBottom: 12,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    storageText: {
        fontSize: 12,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowIcon: {
        width: 40,
        alignItems: 'center',
    },
    rowText: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
