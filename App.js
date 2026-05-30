import React, { useEffect } from 'react';
import Routes from './src/navigation/routes';
import { initDB } from './src/database/database';

export default function App() {
  // O useEffect garante que o banco de dados seja criado assim que o app abrir
  useEffect(() => {
    initDB();
  }, []);

  return <Routes />;
}