import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

const SHARED = [
    { id: '1', title: 'Weekend Trip', owner: 'Alice', date: '2h ago', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', title: 'Family 2023', owner: 'Mom', date: '1d ago', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: '3', title: 'Office Party', owner: 'Boss', date: '1w ago', avatar: 'https://i.pravatar.cc/150?img=8' },
];

export default function SharingScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Sharing</Text>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.card }]}>
                    <Text style={[styles.actionText, { color: theme.tint }]}>Create Shared Album</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.card }]}>
                    <Text style={[styles.actionText, { color: theme.tint }]}>Share with Partner</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={SHARED}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]}>
                        <View style={styles.cardContent}>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{item.owner} • {item.date}</Text>
                            </View>
                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 15,
    },
    list: {
        paddingHorizontal: 16,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        gap: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cardSubtitle: {
        fontSize: 14,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
});
