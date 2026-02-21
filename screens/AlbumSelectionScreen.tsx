import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { getDeviceAlbums, saveSelectedAlbums, getSelectedAlbums } from '../services/albumService';
import * as MediaLibrary from 'expo-media-library';
import { Check, Folder } from 'lucide-react-native';

export default function AlbumSelectionScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlbums();
    }, []);

    const loadAlbums = async () => {
        const allAlbums = await getDeviceAlbums();
        const saved = await getSelectedAlbums();

        setAlbums(allAlbums);
        setSelectedIds(new Set(saved));
        setLoading(false);
    };

    const toggleAlbum = async (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        await saveSelectedAlbums(Array.from(newSelected));
    };

    const renderItem = ({ item }: { item: MediaLibrary.Album }) => {
        const isSelected = selectedIds.has(item.id);
        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    { backgroundColor: theme.card },
                    isSelected && { borderColor: theme.tint, borderWidth: 1 }
                ]}
                onPress={() => toggleAlbum(item.id)}
            >
                <View style={styles.iconContainer}>
                    <Folder color={theme.text} size={24} />
                </View>
                <View style={styles.info}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.count, { color: theme.textSecondary }]}>{item.assetCount} photos</Text>
                </View>
                <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: isSelected ? theme.tint : 'transparent' }]}>
                    {isSelected && <Check color="#fff" size={16} />}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Select Folders to Sync</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {selectedIds.size === 0 ? "Backing up all folders" : `Backing up ${selectedIds.size} folders`}
            </Text>

            <FlatList
                data={albums}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    count: {
        fontSize: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
