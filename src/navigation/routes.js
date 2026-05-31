import React, { useMemo, useRef, useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddPayableScreen from '../screens/AddPayableScreen';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PayablesScreen from '../screens/PayablesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StartScreen from '../screens/StartScreen';
import TrashScreen from '../screens/TrashScreen';
import HamburgerMenu, { MenuToggleIcon } from '../components/HamburgerMenu';
import HomeFloatingButton from '../components/HomeFloatingButton';
import { useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

function HeaderLeftControls({
  canGoBack,
  colors,
  isOpen,
  onBack,
  onToggleMenu,
  styles,
}) {
  return (
    <View style={styles.headerLeftControls}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.headerMenuButton}
        onPress={onToggleMenu}
      >
        <MenuToggleIcon color={colors.jade} isOpen={isOpen} />
      </TouchableOpacity>

      {canGoBack && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.headerBackButton}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function Routes() {
  const navigationRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState('Start');
  const { colors, isDark, styles } = useAppTheme();
  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: colors.jade,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.jade,
      },
    };
  }, [colors, isDark]);

  const navigateFromMenu = (routeName) => {
    setMenuOpen(false);

    if (routeName === 'Start') {
      navigationRef.current?.resetRoot({
        index: 0,
        routes: [{ name: 'Start' }],
      });
      return;
    }

    navigationRef.current?.navigate(routeName);
  };

  const goToStart = () => {
    setMenuOpen(false);
    navigationRef.current?.resetRoot({
      index: 0,
      routes: [{ name: 'Start' }],
    });
  };

  const syncCurrentRoute = () => {
    const nextRouteName = navigationRef.current?.getCurrentRoute()?.name || 'Start';
    setCurrentRouteName(nextRouteName);
  };

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onReady={syncCurrentRoute}
        onStateChange={syncCurrentRoute}
      >
        <Stack.Navigator
          initialRouteName="Start"
          screenListeners={{
            state: () => setMenuOpen(false),
          }}
          screenOptions={({ navigation }) => ({
            headerBackVisible: false,
            headerLeft: () => (
              <HeaderLeftControls
                canGoBack={navigation.canGoBack()}
                colors={colors}
                isOpen={menuOpen}
                onBack={() => navigation.goBack()}
                onToggleMenu={() => setMenuOpen((current) => !current)}
                styles={styles}
              />
            ),
            headerLeftContainerStyle: {
              paddingLeft: 8,
              paddingRight: 16,
            },
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleAlign: 'left',
            headerTitleContainerStyle: {
              marginLeft: 8,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: 'bold',
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          })}
        >
          <Stack.Screen
            name="Start"
            component={StartScreen}
            options={{ title: 'Dashboard' }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Controle de Gastos' }}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{ title: 'Novo Gasto' }}
          />
          <Stack.Screen
            name="EditExpense"
            component={AddExpenseScreen}
            options={{ title: 'Editar Gasto' }}
          />
          <Stack.Screen
            name="Payables"
            component={PayablesScreen}
            options={{ title: 'Controle de Despesas' }}
          />
          <Stack.Screen
            name="AddPayable"
            component={AddPayableScreen}
            options={{ title: 'Nova Despesa' }}
          />
          <Stack.Screen
            name="EditPayable"
            component={AddPayableScreen}
            options={{ title: 'Editar Despesa' }}
          />
          <Stack.Screen
            name="Trash"
            component={TrashScreen}
            options={{ title: 'Lixeira' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Configuração' }}
          />
          <Stack.Screen
            name="Tutorial"
            options={{ title: 'Tutorial' }}
          >
            {({ navigation }) => (
              <OnboardingScreen onFinish={() => navigation.goBack()} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      <HamburgerMenu
        isOpen={menuOpen}
        onNavigate={navigateFromMenu}
        onToggle={() => setMenuOpen((current) => !current)}
      />

      {currentRouteName !== 'Start' && (
        <HomeFloatingButton onPress={goToStart} />
      )}
    </>
  );
}
