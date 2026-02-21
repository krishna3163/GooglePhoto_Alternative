import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Search as SearchIcon, Image as ImageIcon } from 'lucide-react-native';
import { searchImagesByText } from '../../database/db';

export default function SearchScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length > 2) {
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

    const renderItem = ({ item }: { item: string }) => (
        <TouchableOpacity style={styles.resultItem}>
            <Image source={{ uri: item }} style={styles.image} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
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
                    data={results}
                    keyExtractor={item => item}
                    renderItem={renderItem}
                    numColumns={3}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={{ gap: 2 }}
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
        </View>
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
        padding: 12,
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
        marginHorizontal: 1,
        marginBottom: 2,
        maxWidth: '33%',
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 8,
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
