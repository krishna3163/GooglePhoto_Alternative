const tintColorLight = '#4285F4'; // Google Blue-ish
const tintColorDark = '#8AB4F8'; // Lighter blue for dark mode

export const Colors = {
    light: {
        text: '#1F2937', // Gray-900
        background: '#FFFFFF',
        tint: tintColorLight,
        tabIconDefault: '#9CA3AF', // Gray-400
        tabIconSelected: tintColorLight,
        card: '#F3F4F6', // Gray-100
        border: '#E5E7EB', // Gray-200
        primary: '#4285F4',
        secondary: '#34A853',
        destructive: '#EA4335',
        surface: '#FFFFFF',
        textSecondary: '#6B7280', // Gray-500
    },
    dark: {
        text: '#F9FAFB', // Gray-50
        background: '#111827', // Gray-900
        tint: tintColorDark,
        tabIconDefault: '#6B7280', // Gray-500
        tabIconSelected: tintColorDark,
        card: '#1F2937', // Gray-800
        border: '#374151', // Gray-700
        primary: '#8AB4F8',
        secondary: '#81C995',
        destructive: '#F28B82',
        surface: '#1F2937',
        textSecondary: '#9CA3AF', // Gray-400
    },
};
