import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Dimensions, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X, Share2, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getFileDownloadUrl } from '../services/telegramService';
// react-native-webview might not be available in all environments; avoid static import.

export default function FileViewerScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Params: fileUri, telegramFileId, mediaType, fileName
    const { fileUri, telegramFileId, mediaType, fileName } = params as any;

    // In a real app, fileUri might be local (if just uploaded) or we need to download it.
    // If it's in the cloud only, we need to download it to a temp path to view it.
    // However, for images we can use the telegram URL if we have it? No, need to sign it/get path.
    // getFileDownloadUrl returns a URL we can use for <Image source={{uri: url}} />? 
    // Yes, but it expires or is public? Telegram Bot File URLs are accessible if you know the token path.

    const [loading, setLoading] = useState(true);
    const [viewUrl, setViewUrl] = useState<string | null>(fileUri || null);

    React.useEffect(() => {
        const loadUrl = async () => {
            if (!viewUrl && telegramFileId) {
                try {
                    const url = await getFileDownloadUrl(telegramFileId);
                    setViewUrl(url);
                } catch (e) {
                    console.error("Failed to get view url", e);
                }
            }
            setLoading(false);
        };
        loadUrl();
    }, [telegramFileId]);

    const handleDownload = async () => {
        try {
            if (!telegramFileId) return;
            const url = await getFileDownloadUrl(telegramFileId);
            const fallbackName = fileName || `file_${telegramFileId.substring(0, 8)}`;
            const localUri = FileSystem.documentDirectory + fallbackName;
            const downloadRes = await FileSystem.downloadAsync(url, localUri);
            if (downloadRes.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadRes.uri);
                } else {
                    alert("Downloaded to " + downloadRes.uri);
                }
            }
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    if (loading) {
        return <View style={[styles.container, { backgroundColor: 'black' }]}><ActivityIndicator size="large" color="#fff" /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: 'black' }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                <X color="#fff" size={28} />
            </TouchableOpacity>

            <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
                    <Download color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {mediaType === 'image' && viewUrl && (
                    <Image source={{ uri: viewUrl }} style={styles.fullImage} resizeMode="contain" />
                )}
                {mediaType === 'video' && viewUrl && (
                    <Video
                        style={styles.fullImage}
                        source={{ uri: viewUrl }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        shouldPlay
                    />
                )}
                {mediaType === 'document' && viewUrl && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', marginBottom: 12 }}>Document preview unavailable in this environment.</Text>
                        <Text style={{ color: '#fff', textDecorationLine: 'underline' }} onPress={async () => {
                            try {
                                await Linking.openURL(viewUrl! as string);
                            } catch (e) {
                                console.error('Failed to open document URL', e);
                            }
                        }}>Open externally</Text>
                    </View>
                )}
                {mediaType === 'document' && !viewUrl && (
                    <Text style={{ color: '#fff' }}>Document cannot be previewed.</Text>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.fileName}>{fileName}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    headerActions: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    fileName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
