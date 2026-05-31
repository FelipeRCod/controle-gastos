import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';

const menuItems = [
  { icon: 'home', label: 'Tela inicial', route: 'Start' },
  { icon: 'wallet', label: 'Controle de Gastos', route: 'Home' },
  { icon: 'alert-circle', label: 'Controle de Despesas', route: 'Payables' },
  { icon: 'trash', label: 'Lixeira', route: 'Trash' },
  { icon: 'settings', label: 'Configuração', route: 'Settings' },
];

export function MenuToggleIcon({ color, isOpen }) {
  if (isOpen) {
    return (
      <View style={{ height: 24, justifyContent: 'center', width: 24 }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: 2,
            height: 4,
            position: 'absolute',
            transform: [{ rotate: '45deg' }],
            width: 24,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: 2,
            height: 4,
            position: 'absolute',
            transform: [{ rotate: '-45deg' }],
            width: 24,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 4 }}>
      <View style={{ backgroundColor: color, borderRadius: 2, height: 4, width: 24 }} />
      <View style={{ backgroundColor: color, borderRadius: 2, height: 4, width: 24 }} />
      <View style={{ backgroundColor: color, borderRadius: 2, height: 4, width: 24 }} />
    </View>
  );
}

export default function HamburgerMenu({ isOpen, onNavigate, onToggle }) {
  const { colors, styles } = useAppTheme();

  return (
    <Modal animationType="fade" transparent visible={isOpen}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.menuBackdrop}
        onPress={onToggle}
      >
        <View style={styles.menuPanel}>
          <TouchableOpacity style={styles.menuCloseButton} onPress={onToggle}>
            <MenuToggleIcon color={colors.jade} isOpen />
          </TouchableOpacity>

          <Text style={styles.menuPanelTitle}>Menu</Text>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuPanelItem}
              onPress={() => onNavigate(item.route)}
            >
              <View style={styles.menuPanelIcon}>
                <Ionicons name={item.icon} size={22} color={colors.jade} />
              </View>
              <Text style={styles.menuPanelText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
