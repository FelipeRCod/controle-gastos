import * as SQLite from 'expo-sqlite';

let databasePromise;

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('gastos.db');
  }

  return databasePromise;
};

// Função para criar a tabela caso ela ainda não exista no celular
export const initDB = async () => {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL
    );
  `);
};

// Função para inserir um registro na tabela
export const addExpense = async (descricao, categoria, valor, data) => {
  const db = await getDatabase();

  return db.runAsync(
    'INSERT INTO gastos (descricao, categoria, valor, data) VALUES ($descricao, $categoria, $valor, $data)',
    {
      $descricao: descricao,
      $categoria: categoria,
      $valor: valor,
      $data: data,
    }
  );
};

// Função para recuperar todos os dados cadastrados
export const getExpenses = async () => {
  const db = await getDatabase();

  // Retorna a lista de gastos, com os mais recentes primeiro
  return db.getAllAsync('SELECT * FROM gastos ORDER BY id DESC');
};

// Função para deletar um registro específico
export const deleteExpense = async (id) => {
  const db = await getDatabase();

  return db.runAsync('DELETE FROM gastos WHERE id = $id', { $id: id });
};
