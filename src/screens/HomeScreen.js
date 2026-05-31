import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ExpenseItem from '../components/ExpenseItem';
import {
  EXPENSE_CATEGORIES,
  getCategoryByKey,
  normalizeCategoryKey,
} from '../constants/categories';
import { deleteExpense, getExpenses } from '../database/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';
import { isDateInPeriod, PERIODS } from '../utils/dateFilters';

const PERIOD_TOTAL_LABELS = {
  day: 'do dia',
  week: 'da semana',
  month: 'do mês',
  year: 'do ano',
};

const getTotalTitle = (periodFilter, categoryFilter) => {
  const isAllPeriods = periodFilter === 'all';
  const isAllCategories = categoryFilter === 'all';

  if (isAllPeriods && isAllCategories) {
    return 'Gasto Total';
  }

  if (isAllPeriods) {
    return `Despesas Total ${getCategoryByKey(categoryFilter).label}`;
  }

  const periodLabel = PERIOD_TOTAL_LABELS[periodFilter] || '';

  if (isAllCategories) {
    return `Despesas Total ${periodLabel}`;
  }

  return `Calculo Total ${periodLabel} com ${getCategoryByKey(categoryFilter).label}`;
};

export default function HomeScreen({ navigation }) {
  const { colors, styles } = useAppTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadData = useCallback(async (canUpdate = () => true) => {
    try {
      if (canUpdate()) {
        setLoading(true);
      }

      const data = await getExpenses();

      if (!canUpdate()) {
        return;
      }

      setExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar gastos:', error);
      if (canUpdate()) {
        Alert.alert('Erro', 'Nao foi possivel carregar a lista de gastos.');
      }
    } finally {
      if (canUpdate()) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadData(() => isActive);

      return () => {
        isActive = false;
      };
    }, [loadData])
  );

  const handleDelete = (id) => {
    Alert.alert(
      'Excluir Gasto',
      'Tem certeza que deseja apagar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id);
              await loadData();
            } catch (error) {
              console.error('Erro ao excluir gasto:', error);
              Alert.alert('Erro', 'Nao foi possivel excluir este gasto.');
            }
          },
        },
      ]
    );
  };

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesPeriod = isDateInPeriod(expense.data, periodFilter);
    const normalizedCategory = normalizeCategoryKey(expense.categoria_base);
    const matchesCategory = categoryFilter === 'all'
      || normalizedCategory === categoryFilter;

    return matchesPeriod && matchesCategory;
  }), [categoryFilter, expenses, periodFilter]);

  const total = useMemo(() => filteredExpenses.reduce(
    (acc, current) => acc + Number(current.valor || 0),
    0
  ), [filteredExpenses]);
  const totalTitle = useMemo(
    () => getTotalTitle(periodFilter, categoryFilter),
    [categoryFilter, periodFilter]
  );

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{totalTitle}</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        <Text style={styles.totalHint}>
          Gastos manuais e contas ja pagas aparecem conforme periodo e categoria.
        </Text>
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterTitle}>Periodo</Text>
        <View style={styles.filterRow}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              activeOpacity={0.8}
              onPress={() => setPeriodFilter(period.key)}
              style={[
                styles.filterChip,
                periodFilter === period.key && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  periodFilter === period.key && styles.filterChipTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterTitle}>Categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCategoryFilter('all')}
            style={[
              styles.filterChip,
              categoryFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                categoryFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {EXPENSE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              activeOpacity={0.8}
              onPress={() => setCategoryFilter(category.key)}
              style={[
                styles.filterChip,
                categoryFilter === category.key && styles.filterChipActive,
                categoryFilter === category.key && { borderColor: category.color },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === category.key && styles.filterChipTextActive,
                  categoryFilter === category.key && { color: category.color },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.listLoadingContainer}>
          <ActivityIndicator size="small" color={colors.jade} />
          <Text style={styles.loadingText}>Carregando gastos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ExpenseItem item={item} onLongPress={() => handleDelete(item.id)} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum gasto encontrado neste filtro.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={styles.buttonText}>+ Novo Gasto</Text>
      </TouchableOpacity>
    </View>
  );
}
