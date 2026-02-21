import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Image, Search, FolderHeart, Share2, CircleUser, Cloud } from 'lucide-react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.tint,
                tabBarInactiveTintColor: theme.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopWidth: 1, // Minimal border
                    borderColor: theme.border,
                    height: 60, // Slightly taller
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                headerStyle: {
                    backgroundColor: theme.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 24,
                    color: theme.text,
                },
                headerTitleAlign: 'left',
                headerShadowVisible: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Photos',
                    headerTitle: 'Gallery',
                    tabBarIcon: ({ color, size }) => <Image color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="cloud"
                options={{
                    title: 'Drive',
                    tabBarIcon: ({ color, size }) => <Cloud color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="albums"
                options={{
                    title: 'Albums',
                    tabBarIcon: ({ color, size }) => <FolderHeart color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <CircleUser color={color} size={size} />,
                }}
            />
            {/* Hide other tabs if necessary or rearrange */}
            <Tabs.Screen
                name="sharing"
                options={{
                    href: null, // Hide sharing for now to make space, or keep if 5 tabs fitting
                }}
            />
        </Tabs>
    );
}
