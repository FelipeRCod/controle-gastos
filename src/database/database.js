import * as SQLite from 'expo-sqlite';

// Cria ou abre o banco de dados local
const db = SQLite.openDatabaseSync('gastos.db');

// Função para criar a tabela caso ela ainda não exista no celular
export const initDB = () => {
  db.execSync(`
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
export const addExpense = (descricao, categoria, valor, data) => {
  const statement = db.prepareSync(
    'INSERT INTO gastos (descricao, categoria, valor, data) VALUES ($descricao, $categoria, $valor, $data)'
  );
  
  const result = statement.executeSync({
    $descricao: descricao,
    $categoria: categoria,
    $valor: valor,
    $data: data,
  });
  
  return result.lastInsertRowId;
};

// Função para recuperar todos os dados cadastrados
export const getExpenses = () => {
  // Retorna a lista de gastos, com os mais recentes primeiro
  return db.getAllSync('SELECT * FROM gastos ORDER BY id DESC');
};
// Função para deletar um registro específico
export const deleteExpense = (id) => {
  const statement = db.prepareSync('DELETE FROM gastos WHERE id = $id');
  statement.executeSync({ $id: id });
};