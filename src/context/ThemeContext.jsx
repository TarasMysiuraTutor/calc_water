import { useState, useEffect } from 'react';
import { ThemeContext } from './theme-context';

const THEME_KEY = 'theme';
const THEMES = ['light', 'dark', 'auto'];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return THEMES.includes(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      void error;
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

