import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { globalStyles } from '../styles/styles';

const logoSource = require('../assets/logo-mark.png');

export default function SplashScreen() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const animatedStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.55, 1],
    }),
    transform: [{
      scale: pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.94, 1.04],
      }),
    }],
  };

  return (
    <View style={globalStyles.splashContainer}>
      <Animated.View style={[globalStyles.splashPulse, animatedStyle]}>
        <Image
          source={logoSource}
          style={globalStyles.splashPulseLogo}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={globalStyles.splashTitle}>Jade Controle de Gastos</Text>
    </View>
  );
}
