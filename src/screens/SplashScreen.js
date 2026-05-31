import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { colors, globalStyles } from '../styles/styles';

const splashSource = require('../assets/splash.png');

export default function SplashScreen() {
  return (
    <View style={globalStyles.splashContainer}>
      <Image
        source={splashSource}
        style={globalStyles.splashImage}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="large"
        color={colors.jade}
        style={globalStyles.splashLoader}
      />
    </View>
  );
}
