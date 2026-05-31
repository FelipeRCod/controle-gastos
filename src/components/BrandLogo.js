import React from 'react';
import { Image, Text, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

const logoSource = require('../assets/logo-mark.png');

export default function BrandLogo({ size = 'medium', showName = true }) {
  const { styles } = useAppTheme();
  const isLarge = size === 'large';

  return (
    <View style={styles.brandContainer}>
      <View style={isLarge ? styles.logoFrameLarge : styles.logoFrame}>
        <Image
          source={logoSource}
          style={isLarge ? styles.logoImageLarge : styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {showName && (
        <View>
          <Text style={isLarge ? styles.brandTitleLarge : styles.brandTitle}>
            Jade
          </Text>
          <Text style={styles.brandSubtitle}>Controle de Gastos</Text>
        </View>
      )}
    </View>
  );
}
