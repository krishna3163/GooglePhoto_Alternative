import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, useColorScheme, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { getDeviceAlbums } from '../../services/albumService';
import { Folder } from 'lucide-react-native';

export default function AlbumsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlbums();
    }, []);

    const loadAlbums = async () => {
        const data = await getDeviceAlbums();
        setAlbums(data);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cover}>
                {/* Expo Media Library doesn't give a cover URL directly easily without fetching assets. 
              We'll use a placeholder folder icon for now to keep it fast. */}
                <Folder size={48} color={theme.textSecondary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.count, { color: theme.textSecondary }]}>{item.assetCount}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.header, { color: theme.text }]}>Albums</Text>

            {loading ? (
                <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={albums}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        padding: 16,
    },
    grid: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cover: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        padding: 12,
    },
    title: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 4,
    },
    count: {
        fontSize: 12,
    },
});
