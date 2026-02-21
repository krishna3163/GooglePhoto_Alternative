import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Alert, ScrollView, Switch, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/Colors';
import { saveTelegramConfig, getTelegramConfig } from '../services/storage';
import { uploadFileToTelegram } from '../services/telegramService';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [botToken, setBotToken] = useState('');
    const [chatId, setChatId] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // New Toggles
    const [autoBackup, setAutoBackup] = useState(false); // Default OFF
    const [wifiOnly, setWifiOnly] = useState(true); // Default ON
    const [backgroundSync, setBackgroundSync] = useState(false); // Default OFF
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const config = await getTelegramConfig();
        if (config.token) setBotToken(config.token);
        if (config.chatId) setChatId(config.chatId);

        const savedAutoBackup = await AsyncStorage.getItem('settings.autoBackup');
        if (savedAutoBackup !== null) setAutoBackup(JSON.parse(savedAutoBackup));

        // Explicitly check for null to set default true for wifiOnly if not set?
        // Or just use the initial state if null.
        // Initial state is true, so if null it stays true. Good.
        const savedWifiOnly = await AsyncStorage.getItem('settings.wifiOnly');
        if (savedWifiOnly !== null) setWifiOnly(JSON.parse(savedWifiOnly));

        const savedBackgroundSync = await AsyncStorage.getItem('settings.backgroundSync');
        if (savedBackgroundSync !== null) setBackgroundSync(JSON.parse(savedBackgroundSync));
    };

    const handleSave = async () => {
        if (!botToken.trim() || !chatId.trim()) {
            setStatusMessage('Both fields are required.');
            return;
        }

        setIsSaving(true);
        try {
            await saveTelegramConfig(botToken.trim(), chatId.trim());

            // Save other settings
            await AsyncStorage.setItem('settings.autoBackup', JSON.stringify(autoBackup));
            await AsyncStorage.setItem('settings.wifiOnly', JSON.stringify(wifiOnly));
            await AsyncStorage.setItem('settings.backgroundSync', JSON.stringify(backgroundSync));

            setStatusMessage('Configuration saved successfully');
        } catch (error) {
            setStatusMessage('Failed to save configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Permission to access camera roll is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIsUploading(true);
                setStatusMessage('Uploading test image...');

                try {
                    await uploadFileToTelegram(result.assets[0].uri);
                    setStatusMessage('Test upload successful!');
                    Alert.alert("Success", "Test image uploaded to Telegram!");
                } catch (error: any) {
                    console.error(error);
                    setStatusMessage(`Upload failed: ${error.message || 'Unknown error'}`);
                    Alert.alert("Error", "Failed to upload image. Check console for details.");
                } finally {
                    setIsUploading(false);
                }
            }
        } catch (error: any) {
            setStatusMessage(`Error picking image: ${error.message}`);
        }
    };

    const isLargeScreen = width > 800;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: theme.card }, isLargeScreen && styles.cardLarge]}>
                    <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

                    <View style={isLargeScreen ? styles.sectionsGrid : styles.sectionsColumn}>
                        {/* Telegram Config Section */}
                        <View style={isLargeScreen ? styles.section : styles.fullWidth}>
                            <div className="sectionHeader">
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Telegram Config</Text>
                            </div>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Bot Token</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Enter Telegram Bot Token"
                                    placeholderTextColor={theme.textSecondary}
                                    value={botToken}
                                    onChangeText={setBotToken}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Chat ID</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Enter Chat ID"
                                    placeholderTextColor={theme.textSecondary}
                                    value={chatId}
                                    onChangeText={setChatId}
                                    keyboardType="numeric"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.primary, opacity: isSaving ? 0.7 : 1 }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Settings</Text>}
                            </TouchableOpacity>

                            {statusMessage ? (
                                <Text style={[styles.statusText, { color: statusMessage.includes('success') ? theme.secondary : theme.destructive }]}>
                                    {statusMessage}
                                </Text>
                            ) : null}
                        </View>

                        {/* Backup Settings Section */}
                        <View style={isLargeScreen ? styles.section : styles.fullWidth}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Backup Settings</Text>
                            </View>

                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>Auto Backup</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>Backup new photos automatically</Text>
                                </View>
                                <Switch value={autoBackup} onValueChange={setAutoBackup} trackColor={{ false: theme.border, true: theme.primary }} />
                            </View>

                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>Wi-Fi Only</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>Only sync when on Wi-Fi</Text>
                                </View>
                                <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ false: theme.border, true: theme.primary }} />
                            </View>

                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>Background Sync</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>Sync even when app is closed</Text>
                                </View>
                                <Switch value={backgroundSync} onValueChange={setBackgroundSync} trackColor={{ false: theme.border, true: theme.primary }} />
                            </View>

                            <TouchableOpacity
                                style={[styles.menuButton, { borderBottomColor: theme.border }]}
                                onPress={() => router.push('/albums-select')}
                            >
                                <Text style={{ fontSize: 16, color: theme.tint, fontWeight: '600' }}>Manage Backup Folders</Text>
                                <Text style={{ fontSize: 18, color: theme.textSecondary }}>&gt;</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.testButton, { borderColor: theme.primary, marginTop: 16 }]}
                                onPress={handleTestUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.testButtonText, { color: theme.primary }]}>Run Test Upload</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={isLargeScreen ? styles.sectionsGrid : styles.sectionsColumn}>
                        <View style={isLargeScreen ? styles.section : styles.fullWidth}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Links & Info</Text>
                            </View>

                            <TouchableOpacity style={styles.linkRow} onPress={() => router.push({ pathname: '/privacy-policy-view', params: { mode: 'view' } })}>
                                <Text style={[styles.linkText, { color: theme.text }]}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.linkRow} onPress={() => router.push({ pathname: '/permission-intro', params: { mode: 'view' } })}>
                                <Text style={[styles.linkText, { color: theme.text }]}>Permissions Explained</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.linkRow} onPress={() => router.push({ pathname: '/disclaimer', params: { mode: 'view' } })}>
                                <Text style={[styles.linkText, { color: theme.text }]}>Technical Disclaimer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/about')}>
                                <Text style={[styles.linkText, { color: theme.text }]}>About App</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={isLargeScreen ? styles.section : styles.fullWidth}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Storage Privacy</Text>
                            </View>
                            <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                    Your files are stored in your private Telegram Cloud. The app only facilitates the transfer. We do not own servers or store your personal data.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    cardLarge: {
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 32,
        textAlign: 'left',
    },
    sectionsGrid: {
        flexDirection: 'row',
        gap: 32,
    },
    sectionsColumn: {
        flexDirection: 'column',
    },
    section: {
        flex: 1,
        marginBottom: 24,
    },
    fullWidth: {
        width: '100%',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusText: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 32,
    },
    testButton: {
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    menuButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    linkRow: {
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    linkText: {
        fontSize: 16,
        fontWeight: '500',
    },
    infoBox: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 20,
    }
});
