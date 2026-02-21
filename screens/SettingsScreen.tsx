import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
import { Colors } from '../constants/Colors';
import { saveTelegramConfig, getTelegramConfig } from '../services/storage';
import { uploadFileToTelegram } from '../services/telegramService';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
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

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Telegram Config</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Bot Token</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        placeholder="Enter Telegram Bot Token"
                        placeholderTextColor={theme.textSecondary}
                        value={botToken}
                        onChangeText={setBotToken}
                        autoCapitalize="none"
                        autoCorrect={false}
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

                <View style={styles.divider} />

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Backup Settings</Text>
                </View>

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, color: theme.text }}>Auto Backup New Photos</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Automatically upload new photos and videos.</Text>
                    </View>
                    <Switch value={autoBackup} onValueChange={setAutoBackup} trackColor={{ false: theme.border, true: theme.primary }} />
                </View>

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, color: theme.text }}>Sync over Wi-Fi only</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Uploads only when connected to Wi-Fi.</Text>
                    </View>
                    <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ false: theme.border, true: theme.primary }} />
                </View>

                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, color: theme.text }}>Background Sync</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Allow the app to sync in the background.</Text>
                    </View>
                    <Switch value={backgroundSync} onValueChange={setBackgroundSync} trackColor={{ false: theme.border, true: theme.primary }} />
                </View>

                <TouchableOpacity
                    style={[styles.menuButton, { borderBottomColor: theme.border }]}
                    onPress={() => router.push('/albums-select')}
                >
                    <Text style={{ fontSize: 16, color: theme.tint }}>Select Folders to Backup</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary }}>&gt;</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Data & Storage</Text>
                </View>
                <Text style={[styles.dataText, { color: theme.textSecondary }]}>
                    Files are uploaded directly to your Telegram cloud.
                    {'\n'}No files are stored on developer servers.
                </Text>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Legal</Text>
                </View>

                <TouchableOpacity
                    style={[styles.menuButton, { borderBottomColor: theme.border }]}
                    onPress={() => router.push({ pathname: '/privacy-policy-view', params: { mode: 'view' } })}
                >
                    <Text style={{ fontSize: 16, color: theme.tint }}>Privacy Policy</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary }}>&gt;</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { borderBottomColor: theme.border }]}
                    onPress={() => router.push({ pathname: '/permission-intro', params: { mode: 'view' } })}
                >
                    <Text style={{ fontSize: 16, color: theme.tint }}>Permissions Info</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary }}>&gt;</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { borderBottomColor: theme.border }]}
                    onPress={() => router.push({ pathname: '/disclaimer', params: { mode: 'view' } })}
                >
                    <Text style={{ fontSize: 16, color: theme.tint }}>Disclaimer</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary }}>&gt;</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { borderBottomColor: theme.border }]}
                    onPress={() => router.push('/about')}
                >
                    <Text style={{ fontSize: 16, color: theme.tint }}>About TelePhoto Cloud</Text>
                    <Text style={{ fontSize: 16, color: theme.textSecondary }}>&gt;</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, opacity: isSaving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Settings</Text>
                    )}
                </TouchableOpacity>

                {statusMessage ? (
                    <Text style={[
                        styles.statusText,
                        { color: statusMessage.includes('success') ? theme.secondary : theme.destructive }
                    ]}>
                        {statusMessage}
                    </Text>
                ) : null}

                <View style={styles.divider} />

                <TouchableOpacity
                    style={[styles.testButton, { borderColor: theme.primary }]}
                    onPress={handleTestUpload}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : (
                        <Text style={[styles.testButtonText, { color: theme.primary }]}>Test Upload</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 40,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statusText: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 24,
    },
    testButton: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginBottom: 16,
    },
    dataText: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    }
});
