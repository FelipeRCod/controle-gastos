# Controle de Gastos

Aplicativo mobile desenvolvido em React Native com Expo para cadastrar, listar e armazenar gastos pessoais localmente usando SQLite.

## Funcionalidades

- Listagem de gastos cadastrados com `FlatList`.
- Cadastro de novo gasto com descricao, categoria, valor e data.
- Validacao de campos obrigatorios e valor maior que zero.
- Persistencia local dos dados usando SQLite.
- Navegacao entre telas com React Navigation.
- Toolbar configurada com titulos das telas.
- Calculo do total de gastos cadastrados.
- Exclusao de gasto com alerta de confirmacao.

## Tecnologias

- React Native
- Expo
- JavaScript
- React Navigation
- expo-sqlite
- StyleSheet

## Estrutura

```text
src/
  components/
    ExpenseItem.js
  database/
    database.js
  navigation/
    routes.js
  screens/
    AddExpenseScreen.js
    HomeScreen.js
  styles/
    styles.js
```

## Como executar

Instale as dependencias:

```bash
npm install
```

Inicie o projeto:

```bash
npm start
```

Depois, use o Expo Go no celular ou escolha uma das opcoes exibidas no terminal para abrir no emulador.

Tambem e possivel executar diretamente:

```bash
npm run android
npm run ios
npm run web
```

## Banco de dados

O app cria automaticamente o banco `gastos.db` e a tabela `gastos` ao iniciar. Os registros ficam salvos localmente no dispositivo.

Estrutura da tabela:

```sql
CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor REAL NOT NULL,
  data TEXT NOT NULL
);
```
