import * as SQLite from 'expo-sqlite';
import {
  CATEGORY_KEYS,
  getCategoryLabel,
  inferCategoryKey,
  normalizeCategoryKey,
} from '../constants/categories';

let databasePromise;
const ONBOARDING_VERSION = '3';
const TRASH_RETENTION_DAYS = 30;

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
      categoria_base TEXT NOT NULL DEFAULT 'other',
      valor REAL NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contas_pagar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL,
      categoria_base TEXT NOT NULL DEFAULT 'other',
      valor REAL NOT NULL,
      data_vencimento TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      data_pagamento TEXT,
      expense_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      chave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lixeira (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origem TEXT NOT NULL,
      registro_id INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      excluido_em TEXT NOT NULL,
      expira_em TEXT NOT NULL
    );
  `);

  await ensureColumn(db, 'gastos', 'categoria_base', "TEXT NOT NULL DEFAULT 'other'");
  await ensureColumn(db, 'contas_pagar', 'categoria_base', "TEXT NOT NULL DEFAULT 'other'");
  await backfillCategoryBase(db, 'gastos');
  await backfillCategoryBase(db, 'contas_pagar');
  await purgeExpiredTrashItems();
};

const ensureColumn = async (db, tableName, columnName, columnDefinition) => {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
};

const backfillCategoryBase = async (db, tableName) => {
  const rows = await db.getAllAsync(
    `SELECT id, categoria, categoria_base FROM ${tableName}`
  );

  await Promise.all(rows.map((row) => {
    const normalizedKey = normalizeCategoryKey(row.categoria_base);

    if (normalizedKey !== CATEGORY_KEYS.OTHER || !row.categoria) {
      return Promise.resolve();
    }

    return db.runAsync(
      `UPDATE ${tableName} SET categoria_base = $categoriaBase WHERE id = $id`,
      {
        $categoriaBase: inferCategoryKey(row.categoria),
        $id: row.id,
      }
    );
  }));
};

// Função para inserir um registro na tabela
export const addExpense = async (descricao, categoriaBase, categoria, valor, data) => {
  const db = await getDatabase();
  const normalizedCategoryBase = normalizeCategoryKey(categoriaBase);
  const displayCategory = getCategoryLabel(normalizedCategoryBase, categoria);

  return db.runAsync(
    `INSERT INTO gastos
      (descricao, categoria, categoria_base, valor, data)
      VALUES ($descricao, $categoria, $categoriaBase, $valor, $data)`,
    {
      $descricao: descricao,
      $categoria: displayCategory,
      $categoriaBase: normalizedCategoryBase,
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
export const getExpenseById = async (id) => {
  const db = await getDatabase();

  return db.getFirstAsync('SELECT * FROM gastos WHERE id = $id', { $id: id });
};

export const addPayable = async (descricao, categoriaBase, categoria, valor, dataVencimento) => {
  const db = await getDatabase();
  const normalizedCategoryBase = normalizeCategoryKey(categoriaBase);
  const displayCategory = getCategoryLabel(normalizedCategoryBase, categoria);

  return db.runAsync(
    `INSERT INTO contas_pagar
      (descricao, categoria, categoria_base, valor, data_vencimento, status)
      VALUES ($descricao, $categoria, $categoriaBase, $valor, $dataVencimento, 'pendente')`,
    {
      $descricao: descricao,
      $categoria: displayCategory,
      $categoriaBase: normalizedCategoryBase,
      $valor: valor,
      $dataVencimento: dataVencimento,
    }
  );
};

export const getPayables = async () => {
  const db = await getDatabase();

  return db.getAllAsync(`
    SELECT * FROM contas_pagar
    ORDER BY
      CASE status WHEN 'pendente' THEN 0 ELSE 1 END,
      id DESC
  `);
};

export const getPayableById = async (id) => {
  const db = await getDatabase();

  return db.getFirstAsync('SELECT * FROM contas_pagar WHERE id = $id', { $id: id });
};

export const markPayableAsPaid = async (id) => {
  const db = await getDatabase();
  let paidExpenseId = null;

  await db.withExclusiveTransactionAsync(async (tx) => {
    const payable = await tx.getFirstAsync(
      'SELECT * FROM contas_pagar WHERE id = $id AND status = $status',
      { $id: id, $status: 'pendente' }
    );

    if (!payable) {
      throw new Error('Conta inexistente ou ja paga.');
    }

    const paymentDate = new Date().toLocaleDateString('pt-BR');
    const result = await tx.runAsync(
      `INSERT INTO gastos
        (descricao, categoria, categoria_base, valor, data)
        VALUES ($descricao, $categoria, $categoriaBase, $valor, $data)`,
      {
        $descricao: payable.descricao,
        $categoria: payable.categoria,
        $categoriaBase: normalizeCategoryKey(payable.categoria_base),
        $valor: payable.valor,
        $data: paymentDate,
      }
    );

    paidExpenseId = result.lastInsertRowId;

    await tx.runAsync(
      `UPDATE contas_pagar
       SET status = 'paga', data_pagamento = $dataPagamento, expense_id = $expenseId
       WHERE id = $id`,
      {
        $dataPagamento: paymentDate,
        $expenseId: paidExpenseId,
        $id: id,
      }
    );
  });

  return paidExpenseId;
};

const getTrashDates = () => {
  const deletedAt = new Date();
  const expiresAt = new Date(deletedAt);
  expiresAt.setDate(expiresAt.getDate() + TRASH_RETENTION_DAYS);

  return {
    deletedAt: deletedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

const insertTrashItem = (tx, origem, registroId, payload) => {
  const { deletedAt, expiresAt } = getTrashDates();

  return tx.runAsync(
    `INSERT INTO lixeira
      (origem, registro_id, payload_json, excluido_em, expira_em)
      VALUES ($origem, $registroId, $payloadJson, $excluidoEm, $expiraEm)`,
    {
      $origem: origem,
      $registroId: registroId,
      $payloadJson: JSON.stringify(payload),
      $excluidoEm: deletedAt,
      $expiraEm: expiresAt,
    }
  );
};

export const moveExpenseToTrash = async (id) => {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (tx) => {
    const expense = await tx.getFirstAsync(
      'SELECT * FROM gastos WHERE id = $id',
      { $id: id }
    );

    if (!expense) {
      throw new Error('Gasto nao encontrado.');
    }

    await insertTrashItem(tx, 'gasto', expense.id, { expense });
    await tx.runAsync('DELETE FROM gastos WHERE id = $id', { $id: id });
  });
};

export const movePayableToTrash = async (id) => {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (tx) => {
    const payable = await tx.getFirstAsync(
      'SELECT * FROM contas_pagar WHERE id = $id',
      { $id: id }
    );

    if (!payable) {
      throw new Error('Despesa nao encontrada.');
    }

    const linkedExpense = payable.expense_id
      ? await tx.getFirstAsync(
        'SELECT * FROM gastos WHERE id = $id',
        { $id: payable.expense_id }
      )
      : null;

    await insertTrashItem(tx, 'despesa', payable.id, { linkedExpense, payable });

    if (linkedExpense) {
      await tx.runAsync('DELETE FROM gastos WHERE id = $id', { $id: linkedExpense.id });
    }

    await tx.runAsync('DELETE FROM contas_pagar WHERE id = $id', { $id: id });
  });
};

const insertExpenseFromPayload = (tx, expense) => tx.runAsync(
  `INSERT INTO gastos
    (id, descricao, categoria, categoria_base, valor, data)
    VALUES ($id, $descricao, $categoria, $categoriaBase, $valor, $data)`,
  {
    $id: expense.id,
    $descricao: expense.descricao,
    $categoria: expense.categoria,
    $categoriaBase: normalizeCategoryKey(expense.categoria_base),
    $valor: expense.valor,
    $data: expense.data,
  }
);

const insertPayableFromPayload = (tx, payable) => tx.runAsync(
  `INSERT INTO contas_pagar
    (id, descricao, categoria, categoria_base, valor, data_vencimento, status, data_pagamento, expense_id)
    VALUES ($id, $descricao, $categoria, $categoriaBase, $valor, $dataVencimento, $status, $dataPagamento, $expenseId)`,
  {
    $id: payable.id,
    $descricao: payable.descricao,
    $categoria: payable.categoria,
    $categoriaBase: normalizeCategoryKey(payable.categoria_base),
    $valor: payable.valor,
    $dataVencimento: payable.data_vencimento,
    $status: payable.status,
    $dataPagamento: payable.data_pagamento,
    $expenseId: payable.expense_id,
  }
);

export const getTrashItems = async () => {
  const db = await getDatabase();
  await purgeExpiredTrashItems();

  const rows = await db.getAllAsync('SELECT * FROM lixeira ORDER BY id DESC');

  return rows.map((row) => ({
    ...row,
    payload: JSON.parse(row.payload_json),
  }));
};

export const restoreTrashItem = async (id) => {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (tx) => {
    const trashItem = await tx.getFirstAsync(
      'SELECT * FROM lixeira WHERE id = $id',
      { $id: id }
    );

    if (!trashItem) {
      throw new Error('Item da lixeira nao encontrado.');
    }

    const payload = JSON.parse(trashItem.payload_json);

    if (trashItem.origem === 'gasto') {
      await insertExpenseFromPayload(tx, payload.expense);
    }

    if (trashItem.origem === 'despesa') {
      if (payload.linkedExpense) {
        await insertExpenseFromPayload(tx, payload.linkedExpense);
      }

      await insertPayableFromPayload(tx, payload.payable);
    }

    await tx.runAsync('DELETE FROM lixeira WHERE id = $id', { $id: id });
  });
};

export const deleteTrashItemPermanently = async (id) => {
  const db = await getDatabase();

  return db.runAsync('DELETE FROM lixeira WHERE id = $id', { $id: id });
};

export const purgeExpiredTrashItems = async () => {
  const db = await getDatabase();

  return db.runAsync(
    'DELETE FROM lixeira WHERE expira_em <= $now',
    { $now: new Date().toISOString() }
  );
};

export const updateExpense = async (id, dados) => {
  const db = await getDatabase();
  const normalizedCategoryBase = normalizeCategoryKey(dados.categoriaBase);
  const displayCategory = getCategoryLabel(normalizedCategoryBase, dados.categoria);

  return db.runAsync(
    `UPDATE gastos
     SET descricao = $descricao,
         categoria = $categoria,
         categoria_base = $categoriaBase,
         valor = $valor,
         data = $data
     WHERE id = $id`,
    {
      $descricao: dados.descricao,
      $categoria: displayCategory,
      $categoriaBase: normalizedCategoryBase,
      $valor: dados.valor,
      $data: dados.data,
      $id: id,
    }
  );
};

export const updatePayable = async (id, dados) => {
  const db = await getDatabase();
  const normalizedCategoryBase = normalizeCategoryKey(dados.categoriaBase);
  const displayCategory = getCategoryLabel(normalizedCategoryBase, dados.categoria);

  await db.withExclusiveTransactionAsync(async (tx) => {
    const payable = await tx.getFirstAsync(
      'SELECT * FROM contas_pagar WHERE id = $id',
      { $id: id }
    );

    if (!payable) {
      throw new Error('Despesa nao encontrada.');
    }

    await tx.runAsync(
      `UPDATE contas_pagar
       SET descricao = $descricao,
           categoria = $categoria,
           categoria_base = $categoriaBase,
           valor = $valor,
           data_vencimento = $dataVencimento
       WHERE id = $id`,
      {
        $descricao: dados.descricao,
        $categoria: displayCategory,
        $categoriaBase: normalizedCategoryBase,
        $valor: dados.valor,
        $dataVencimento: dados.dataVencimento,
        $id: id,
      }
    );

    if (payable.status === 'paga' && payable.expense_id) {
      await tx.runAsync(
        `UPDATE gastos
         SET descricao = $descricao,
             categoria = $categoria,
             categoria_base = $categoriaBase,
             valor = $valor
         WHERE id = $id`,
        {
          $descricao: dados.descricao,
          $categoria: displayCategory,
          $categoriaBase: normalizedCategoryBase,
          $valor: dados.valor,
          $id: payable.expense_id,
        }
      );
    }
  });
};

export const hasSeenOnboarding = async () => {
  const db = await getDatabase();
  const setting = await db.getFirstAsync(
    'SELECT valor FROM app_settings WHERE chave = $chave',
    { $chave: 'onboarding_version' }
  );

  return setting?.valor === ONBOARDING_VERSION;
};

export const setOnboardingSeen = async () => {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO app_settings (chave, valor)
     VALUES ($chave, $valor)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    { $chave: 'onboarding_version', $valor: ONBOARDING_VERSION }
  );
};

export const getThemePreference = async () => {
  const db = await getDatabase();
  const setting = await db.getFirstAsync(
    'SELECT valor FROM app_settings WHERE chave = $chave',
    { $chave: 'theme_preference' }
  );

  if (['system', 'light', 'dark'].includes(setting?.valor)) {
    return setting.valor;
  }

  return 'system';
};

export const saveThemePreference = async (themePreference) => {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO app_settings (chave, valor)
     VALUES ($chave, $valor)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    { $chave: 'theme_preference', $valor: themePreference }
  );
};
