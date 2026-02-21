import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useColorScheme, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Settings, Cloud, Lock, Trash2, LogOut } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getStorageStats } from '../../database/db';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [stats, setStats] = useState({ totalFiles: 0, photos: 0, videos: 0, docs: 0 });

    useFocusEffect(
        useCallback(() => {
            getStorageStats().then(setStats);
        }, [])
    );

    const isLargeScreen = width > 700;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.header, isLargeScreen && styles.headerLarge]}>
                    <Image
                        source={{ uri: 'https://i.pravatar.cc/300' }}
                        style={styles.avatar}
                    />
                    <View style={isLargeScreen ? styles.headerInfoLarge : styles.headerInfo}>
                        <Text style={[styles.name, { color: theme.text }]}>John Doe</Text>
                        <Text style={[styles.email, { color: theme.textSecondary }]}>john.doe@example.com</Text>
                    </View>
                </View>

                <View style={[styles.contentLayout, isLargeScreen && styles.contentLayoutLarge]}>
                    <View style={isLargeScreen ? styles.leftColumn : styles.fullWidth}>
                        <View style={[styles.backupCard, { backgroundColor: theme.card }]}>
                            <View style={styles.backupHeader}>
                                <Cloud color={theme.tint} size={24} />
                                <Text style={[styles.backupTitle, { color: theme.text }]}>Backup is on</Text>
                            </View>
                            <Text style={[styles.backupStatus, { color: theme.textSecondary }]}>All items are backed up</Text>
                            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                                <View style={[styles.progressFill, { backgroundColor: theme.tint, width: '100%' }]} />
                            </View>
                            <Text style={[styles.storageText, { color: theme.textSecondary }]}>{stats.totalFiles} items stored in Telegram Cloud</Text>
                        </View>

                        <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stats.photos}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Photos</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stats.videos}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Videos</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stats.docs}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Docs</Text>
                            </View>
                        </View>
                    </View>

                    <View style={isLargeScreen ? styles.rightColumn : styles.fullWidth}>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account Settings</Text>

                            <TouchableOpacity
                                style={[styles.row, { borderBottomColor: theme.border }]}
                                onPress={() => router.push('/settings')}
                            >
                                <View style={styles.rowIcon}>
                                    <Settings color={theme.text} size={20} />
                                </View>
                                <Text style={[styles.rowText, { color: theme.text }]}>Telegram API & Sync Settings</Text>
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
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    headerLarge: {
        flexDirection: 'row',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerInfoLarge: {
        marginLeft: 24,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
    },
    contentLayout: {
        paddingHorizontal: 16,
    },
    contentLayoutLarge: {
        flexDirection: 'row',
        gap: 24,
    },
    fullWidth: {
        width: '100%',
    },
    leftColumn: {
        flex: 1,
    },
    rightColumn: {
        flex: 1,
    },
    backupCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    backupTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backupStatus: {
        fontSize: 14,
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    storageText: {
        fontSize: 12,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 24,
        padding: 20,
        borderRadius: 20,
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 13,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '70%',
        alignSelf: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 16,
        marginLeft: 12,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowIcon: {
        width: 48,
        alignItems: 'center',
    },
    rowText: {
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        gap: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
