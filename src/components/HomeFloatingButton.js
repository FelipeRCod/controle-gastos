import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';

export default function HomeFloatingButton({ onPress }) {
  const { colors, styles } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.homeFloatingButton}
    >
      <Ionicons name="home" size={24} color={colors.background} />
    </TouchableOpacity>
  );
}
