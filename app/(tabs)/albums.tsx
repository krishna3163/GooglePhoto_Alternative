import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { getDeviceAlbums } from '../../services/albumService';
import { Folder } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AlbumsScreen() {
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const numColumns = width > 1000 ? 5 : width > 700 ? 4 : 2;

    useEffect(() => {
        loadAlbums();
    }, []);

    const loadAlbums = async () => {
        const data = await getDeviceAlbums();
        setAlbums(data);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, maxWidth: `${100 / numColumns - 4}%` }]}>
            <View style={styles.cover}>
                <Folder size={48} color={theme.textSecondary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.count, { color: theme.textSecondary }]}>{item.assetCount} items</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <Text style={[styles.header, { color: theme.text }]}>Albums</Text>

            {loading ? (
                <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    key={numColumns}
                    data={albums}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    numColumns={numColumns}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    grid: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: 16,
    },
    card: {
        flex: 1,
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
