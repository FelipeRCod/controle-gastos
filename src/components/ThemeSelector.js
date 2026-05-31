import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';

const options = [
  { icon: 'contrast', key: 'system', label: 'Sistema' },
  { icon: 'sunny', key: 'light', label: 'Claro' },
  { icon: 'moon', key: 'dark', label: 'Escuro' },
];

export default function ThemeSelector() {
  const { colors, setThemePreference, styles, themePreference } = useAppTheme();

  return (
    <View style={styles.themeOptionsRow}>
      {options.map((option) => {
        const isActive = themePreference === option.key;

        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.8}
            onPress={() => setThemePreference(option.key)}
            style={[
              styles.themeOption,
              isActive && styles.themeOptionActive,
            ]}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={isActive ? colors.jade : colors.muted}
            />
            <Text
              style={[
                styles.themeOptionText,
                isActive && styles.themeOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
