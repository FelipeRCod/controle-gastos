# Jade Controle de Gastos

Aplicativo mobile desenvolvido em React Native com Expo para cadastrar gastos, organizar despesas pendentes e armazenar tudo localmente usando SQLite.

## Funcionalidades

- Splash screen com logo e nome do sistema.
- Tutorial inicial versionado para a entrega atual.
- Tela inicial com logo e atalhos para Controle de Gastos e Controle de Despesas.
- Menu hamburger no header com acesso a tela inicial, gastos, controle de despesas, tema e configuracao.
- Listagem de gastos cadastrados com `FlatList`.
- Cadastro de novo gasto com descricao, categoria selecionavel, valor e data.
- Filtros de gastos por todos, dia, semana, mes, ano e categoria.
- Valores aceitam reais inteiros ou centavos com virgula/ponto, como `300`, `300,25` ou `300.25`.
- Icones coloridos por categoria na listagem de gastos e despesas.
- Cadastro de despesas pendentes.
- Despesa pendente so entra no controle de gastos quando for marcada como paga.
- Validacao de campos obrigatorios, valor maior que zero e data em `DD/MM/AAAA`.
- Persistencia local dos dados usando SQLite.
- Calculo do total de gastos e do total pendente.
- Exclusao de gasto com alerta de confirmacao.
- Tema visual preto com verde jade.
- Tema automatico pelo sistema operacional, com opcao manual para claro, escuro ou sistema.

## Tecnologias

- React Native
- Expo
- JavaScript
- React Navigation
- Native Stack
- @expo/vector-icons
- expo-sqlite
- StyleSheet

## Estrutura

```text
src/
  assets/
    logo.png
    logo-mark.png
    splash.png
  components/
    BrandLogo.js
    CategoryPicker.js
    ExpenseItem.js
    HomeFloatingButton.js
    HamburgerMenu.js
    PayableItem.js
    ThemeSelector.js
  constants/
    categories.js
  database/
    database.js
  navigation/
    routes.js
  screens/
    AddExpenseScreen.js
    AddPayableScreen.js
    HomeScreen.js
    OnboardingScreen.js
    PayablesScreen.js
    SettingsScreen.js
    SplashScreen.js
    StartScreen.js
  styles/
    styles.js
  theme/
    ThemeContext.js
  utils/
    dateFilters.js
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

## Logo e tela inicial

O app usa `src/assets/logo.png` como icone do projeto, `src/assets/logo-mark.png` como marca sem fundo nos headers/menus e `src/assets/splash.png` como imagem da tela inicial de carregamento.

## Banco de dados

O app cria automaticamente o banco `gastos.db` ao iniciar.

Tabela de gastos:

```sql
CREATE TABLE IF NOT EXISTS gastos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  categoria_base TEXT NOT NULL DEFAULT 'other',
  valor REAL NOT NULL,
  data TEXT NOT NULL
);
```

Tabela de despesas pendentes:

```sql
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
```

Tabela de configuracoes:

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  chave TEXT PRIMARY KEY NOT NULL,
  valor TEXT NOT NULL
);
```
