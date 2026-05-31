import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import Routes from './src/navigation/routes';
import { initDB } from './src/database/database';
import { globalStyles } from './src/styles/styles';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const setupDatabase = async () => {
      try {
        await initDB();

        if (isMounted) {
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
    return (
      <View style={globalStyles.centeredContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={globalStyles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return <Routes />;
}
