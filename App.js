import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Routes from './src/navigation/routes';
import {
  getThemePreference,
  hasSeenOnboarding,
  initDB,
  setOnboardingSeen,
} from './src/database/database';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SplashScreen from './src/screens/SplashScreen';
import { globalStyles } from './src/styles/styles';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [themePreference, setThemePreference] = useState('system');

  useEffect(() => {
    let isMounted = true;

    const setupDatabase = async () => {
      try {
        await initDB();
        const [seenOnboarding, savedThemePreference] = await Promise.all([
          hasSeenOnboarding(),
          getThemePreference(),
          new Promise((resolve) => setTimeout(resolve, 1400)),
        ]);

        if (isMounted) {
          setThemePreference(savedThemePreference);
          setShowOnboarding(!seenOnboarding);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);

        if (isMounted) {
          setHasError(true);
          Alert.alert(
            'Erro',
            'Nao foi possivel preparar o banco de dados do aplicativo.'
          );
        }
      }
    };

    setupDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFinishOnboarding = async () => {
    try {
      await setOnboardingSeen();
      setShowOnboarding(false);
    } catch (error) {
      console.error('Erro ao salvar onboarding:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar a preferencia inicial.');
    }
  };

  if (hasError) {
    return (
      <View style={globalStyles.centeredContainer}>
        <Text style={globalStyles.errorText}>
          Nao foi possivel iniciar o aplicativo.
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return (
      <ThemeProvider initialPreference={themePreference}>
        <OnboardingScreen onFinish={handleFinishOnboarding} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider initialPreference={themePreference}>
      <Routes />
    </ThemeProvider>
  );
}
