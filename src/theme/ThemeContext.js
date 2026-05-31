import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { saveThemePreference } from '../database/database';
import { createGlobalStyles, getThemeColors } from '../styles/styles';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialPreference = 'system' }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState(initialPreference);

  const themeName = themePreference === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themePreference;

  const colors = useMemo(() => getThemeColors(themeName), [themeName]);
  const styles = useMemo(() => createGlobalStyles(colors), [colors]);

  const setThemePreference = async (nextPreference) => {
    setThemePreferenceState(nextPreference);
    await saveThemePreference(nextPreference);
  };

  const value = useMemo(() => ({
    colors,
    isDark: themeName === 'dark',
    setThemePreference,
    styles,
    themeName,
    themePreference,
  }), [colors, styles, themeName, themePreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme deve ser usado dentro de ThemeProvider.');
  }

  return context;
}
