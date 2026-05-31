import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { useAppTheme } from '../theme/ThemeContext';

export default function CategoryPicker({ onSelect, selectedCategory }) {
  const { colors, styles } = useAppTheme();

  return (
    <View style={styles.categoryGrid}>
      {EXPENSE_CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.key;

        return (
          <TouchableOpacity
            key={category.key}
            activeOpacity={0.8}
            onPress={() => onSelect(category.key)}
            style={[
              styles.categoryOption,
              isSelected && styles.categoryOptionActive,
              isSelected && { borderColor: category.color },
            ]}
          >
            <View
              style={[
                styles.categoryOptionIcon,
                { backgroundColor: `${category.color}22` },
              ]}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={isSelected ? category.color : colors.muted}
              />
            </View>
            <Text
              style={[
                styles.categoryOptionText,
                isSelected && { color: colors.text },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
