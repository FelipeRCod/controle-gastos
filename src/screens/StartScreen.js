import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '../components/BrandLogo';
import { useAppTheme } from '../theme/ThemeContext';

const actions = [
  {
    description: 'Veja seus gastos, filtros por periodo e total calculado.',
    icon: 'wallet',
    label: 'Controle de Gastos',
    route: 'Home',
  },
  {
    description: 'Cadastre despesas futuras e registre quando forem pagas.',
    icon: 'alert-circle',
    label: 'Controle de Despesas',
    route: 'Payables',
  },
];

export default function StartScreen({ navigation }) {
  const { colors, styles } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.startHeader}>
        <BrandLogo size="large" />
        <Text style={styles.startIntroText}>
          Escolha uma area para organizar seus gastos e despesas.
        </Text>
      </View>

      <View style={styles.startActions}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.route}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(action.route)}
            style={styles.startCard}
          >
            <View style={styles.startCardIcon}>
              <Ionicons name={action.icon} size={30} color={colors.jade} />
            </View>
            <View style={styles.startCardTextBox}>
              <Text style={styles.startCardTitle}>{action.label}</Text>
              <Text style={styles.startCardDescription}>
                {action.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
