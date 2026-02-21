import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Image, View, Text, StyleSheet, useColorScheme, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { initDatabase, getUploadedCount, isImageUploaded, markImageUploaded } from '../../database/db';
import { syncNewImages } from '../../services/syncService';
import { uploadFileToTelegram } from '../../services/telegramService';
import { RefreshCw } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionList } from 'react-native';

const SPACING = 4;

export default function GalleryScreen() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Dynamic columns based on screen width
    const COLUMN_COUNT = width > 1000 ? 7 : width > 700 ? 5 : 3;
    const ITEM_SIZE = (width - (COLUMN_COUNT + 1) * SPACING) / COLUMN_COUNT;

    const [photos, setPhotos] = useState<any[]>([]);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

    useEffect(() => {
        initDatabase().then(() => {
            loadStats();
            loadLocalPhotos();
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        const count = await getUploadedCount();
        setUploadedCount(count);
    };

    const loadLocalPhotos = async () => {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (!permission.granted) return;

        const assets = await MediaLibrary.getAssetsAsync({
            first: 100,
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: [MediaLibrary.SortBy.creationTime],
        });

        const grouped = assets.assets.reduce((acc: any, asset) => {
            const date = new Date(asset.creationTime).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push({
                id: asset.id,
                uri: asset.uri,
            });
            return acc;
        }, {});

        const sections = Object.keys(grouped).map(date => ({
            title: date === new Date().toDateString() ? 'Today' : date,
            data: grouped[date]
        }));

        setPhotos(sections);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncNewImages();
            setLastSyncTime(new Date().toLocaleTimeString());
            await loadStats();
        } catch (error) {
            console.error(error);
            Alert.alert('Sync Failed', 'Could not sync images.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImagePress = async (imageUri: string) => {
        const isUploaded = await isImageUploaded(imageUri);
        if (isUploaded) {
            Alert.alert('Info', 'This image is already backed up.');
            return;
        }

        setUploadingImages(prev => new Set(prev).add(imageUri));

        try {
            await uploadFileToTelegram(imageUri);
            await markImageUploaded(imageUri);
            await loadStats();
            Alert.alert('Success', 'Image uploaded manually!');
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image.');
        } finally {
            setUploadingImages(prev => {
                const next = new Set(prev);
                next.delete(imageUri);
                return next;
            });
        }
    };

    const groupedData = useMemo(() => {
        return photos.map(section => {
            const rows = [];
            for (let i = 0; i < section.data.length; i += COLUMN_COUNT) {
                rows.push({
                    id: section.title + '-row-' + i,
                    items: section.data.slice(i, i + COLUMN_COUNT),
                });
            }
            return {
                ...section,
                data: rows,
            };
        });
    }, [photos, COLUMN_COUNT]);

    const renderSectionHeader = ({ section }: { section: { title: string } }) => {
        return (
            <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.header, { color: theme.text }]}>{section.title}</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        return (
            <View style={styles.row}>
                {item.items.map((photo: any) => {
                    const isUploading = uploadingImages.has(photo.uri);
                    return (
                        <TouchableOpacity
                            key={photo.id}
                            onPress={() => handleImagePress(photo.uri)}
                            activeOpacity={0.8}
                            style={[
                                styles.imageContainer,
                                {
                                    backgroundColor: theme.card,
                                    marginLeft: SPACING,
                                    width: ITEM_SIZE,
                                    height: ITEM_SIZE,
                                }
                            ]}
                        >
                            <Image
                                source={{ uri: photo.uri }}
                                style={[styles.image, { opacity: isUploading ? 0.5 : 1 }]}
                                resizeMode="cover"
                            />
                            {isUploading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
                {Array.from({ length: COLUMN_COUNT - item.items.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={[styles.imageContainer, { marginLeft: SPACING, backgroundColor: 'transparent', width: ITEM_SIZE, height: ITEM_SIZE }]} />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style="auto" />
            <View style={[styles.syncCard, { backgroundColor: theme.card }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.syncTitle, { color: theme.text }]}>Backup Status</Text>
                    <Text style={[styles.syncSubtitle, { color: theme.textSecondary }]}>
                        {uploadedCount} items backed up
                    </Text>
                    {lastSyncTime && (
                        <Text style={[styles.lastSync, { color: theme.textSecondary }]}>
                            Last sync: {lastSyncTime}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.syncButton, { backgroundColor: theme.tint }]}
                    onPress={handleSync}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <RefreshCw color="#fff" size={20} />
                    )}
                </TouchableOpacity>
            </View>

            <SectionList
                sections={groupedData}
                keyExtractor={(item) => item.id}
                renderSectionHeader={renderSectionHeader}
                renderItem={renderItem}
                stickySectionHeadersEnabled={true}
                contentContainerStyle={{ paddingBottom: 20, paddingRight: SPACING }}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    syncCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 16,
        padding: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    syncTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    syncSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    lastSync: {
        fontSize: 12,
        marginTop: 2,
        fontStyle: 'italic',
    },
    syncButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        marginBottom: SPACING,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
