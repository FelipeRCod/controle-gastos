import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ThemeSelector from '../components/ThemeSelector';
import BrandLogo from '../components/BrandLogo';
import { useAppTheme } from '../theme/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { styles, themeName } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.menuHeader}>
        <BrandLogo size="medium" />
        <Text style={styles.screenTitle}>Configuração</Text>
        <Text style={styles.screenSubtitle}>
          Ajuste a aparência e consulte informações do Jade Controle de Gastos.
        </Text>
        <Text style={styles.menuDescription}>
          Itens podem ser editados ou enviados para a Lixeira usando o gesto de arrastar.
        </Text>
      </View>

      <ThemeSelector />

      <View style={styles.settingsCard}>
        <Text style={styles.menuTitle}>Sobre o app</Text>
        <Text style={styles.menuDescription}>
          Tema ativo: {themeName === 'dark' ? 'Escuro' : 'Claro'}
        </Text>
        <Text style={styles.menuDescription}>
          Cadastre gastos, organize o Controle de Despesas e acompanhe seus filtros por período.
        </Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.menuTitle}>Configuracoes futuras</Text>
        <Text style={styles.menuDescription}>
          As demais configuracoes ainda estao em processo de desenvolvimento.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate('Tutorial')}
      >
        <Text style={styles.outlineButtonText}>Ver tutorial novamente</Text>
      </TouchableOpacity>
    </View>
  );
}
