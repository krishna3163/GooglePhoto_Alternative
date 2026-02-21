import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, useColorScheme, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Search as SearchIcon, Image as ImageIcon } from 'lucide-react-native';
import { searchImagesByText } from '../../database/db';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Dynamic columns based on width
    const numColumns = width > 1000 ? 7 : width > 700 ? 5 : 3;

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length > 1) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const matches = await searchImagesByText(query);
            setResults(matches);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFile = (item: any) => {
        router.push({
            pathname: '/file-viewer',
            params: {
                fileUri: item.fileUri,
                telegramFileId: item.telegramFileId,
                mediaType: item.mediaType,
                fileName: item.fileName
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.resultItem, { maxWidth: `${100 / numColumns}%` }]}
            onPress={() => handleOpenFile(item)}
        >
            <Image source={{ uri: item.fileUri }} style={styles.image} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
                    <SearchIcon color={theme.textSecondary} size={20} />
                    <TextInput
                        placeholder="Search photos by text (OCR)"
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.input, { color: theme.text }]}
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                    />
                    {loading && <ActivityIndicator size="small" />}
                </View>
            </View>

            {results.length === 0 && query.length > 0 && !loading ? (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No matching text found.</Text>
                </View>
            ) : (
                <FlatList
                    key={numColumns} // Force re-render on column count change
                    data={results}
                    keyExtractor={item => item.id || item.fileUri}
                    renderItem={renderItem}
                    numColumns={numColumns}
                    contentContainerStyle={styles.grid}
                />
            )}

            {query.length === 0 && (
                <View style={styles.emptyState}>
                    <ImageIcon size={48} color={theme.border} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 16 }]}>
                        Type to search for text inside your photos.
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingBottom: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    grid: {
        padding: 2,
    },
    resultItem: {
        flex: 1,
        aspectRatio: 1,
        padding: 2,
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        fontSize: 16,
    },
});
