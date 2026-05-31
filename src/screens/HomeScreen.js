import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ExpenseItem from '../components/ExpenseItem';
import {
  EXPENSE_CATEGORIES,
  getCategoryByKey,
  normalizeCategoryKey,
} from '../constants/categories';
import { getExpenses, moveExpenseToTrash } from '../database/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';
import {
  formatBrazilianDate,
  getConfiguredPeriodRange,
  isDateInConfiguredPeriod,
  isPeriodAboveToday,
  isValidBrazilianDate,
  MONTHS,
  PERIODS,
} from '../utils/dateFilters';

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

const currentYear = String(new Date().getFullYear());

const createInitialPeriodConfig = () => ({
  dayDate: '',
  month: new Date().getMonth(),
  monthYear: currentYear,
  weekDate: '',
  weekMode: 'start',
  year: currentYear,
});

const getPeriodHint = (periodFilter, periodConfig) => {
  const range = getConfiguredPeriodRange(periodFilter, periodConfig);

  if (periodFilter === 'all') {
    return 'Periodo: todos';
  }

  if (!range) {
    return 'Selecione as informacoes do periodo.';
  }

  if (periodFilter === 'day') {
    return `Periodo: ${formatBrazilianDate(range.start)}`;
  }

  if (periodFilter === 'month') {
    const monthLabel = MONTHS.find((month) => month.key === Number(periodConfig.month))?.label;
    return `Periodo: ${monthLabel}/${periodConfig.monthYear}`;
  }

  if (periodFilter === 'year') {
    return `Periodo: ${periodConfig.year}`;
  }

  return `Periodo: ${formatBrazilianDate(range.start)} ate ${formatBrazilianDate(range.end)}`;
};

const isFourDigitYear = (yearText) => /^\d{4}$/.test(String(yearText || '').trim());

export default function HomeScreen({ navigation }) {
  const { colors, styles } = useAppTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [periodConfig, setPeriodConfig] = useState(createInitialPeriodConfig);
  const [periodModal, setPeriodModal] = useState(null);
  const [draftPeriodConfig, setDraftPeriodConfig] = useState(createInitialPeriodConfig);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [totalHidden, setTotalHidden] = useState(false);

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
      'Deseja mesmo excluir este item? Ele ficara na Lixeira por 30 dias.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await moveExpenseToTrash(id);
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

  const handleEdit = (item) => {
    Alert.alert(
      'Editar Gasto',
      'Deseja mesmo editar este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Editar',
          onPress: () => navigation.navigate('EditExpense', { item }),
        },
      ]
    );
  };

  const openPeriodFilter = (periodKey) => {
    if (periodKey === 'all') {
      setPeriodFilter('all');
      return;
    }

    setDraftPeriodConfig(periodConfig);
    setPeriodModal(periodKey);
  };

  const closePeriodModal = () => {
    setPeriodModal(null);
  };

  const updateDraftPeriodConfig = (nextValues) => {
    setDraftPeriodConfig((current) => ({
      ...current,
      ...nextValues,
    }));
  };

  const applyPeriodFilter = () => {
    if (periodModal === 'day' && !isValidBrazilianDate(draftPeriodConfig.dayDate)) {
      Alert.alert('Data invalida', 'Informe uma data valida no formato DD/MM/AAAA.');
      return;
    }

    if (periodModal === 'week' && !isValidBrazilianDate(draftPeriodConfig.weekDate)) {
      Alert.alert('Data invalida', 'Informe uma data valida no formato DD/MM/AAAA.');
      return;
    }

    if (periodModal === 'month' && !isFourDigitYear(draftPeriodConfig.monthYear)) {
      Alert.alert('Ano invalido', 'Informe um ano com 4 digitos, como 2026.');
      return;
    }

    if (periodModal === 'year' && !isFourDigitYear(draftPeriodConfig.year)) {
      Alert.alert('Ano invalido', 'Informe um ano com 4 digitos, como 2026.');
      return;
    }

    if (isPeriodAboveToday(periodModal, draftPeriodConfig)) {
      Alert.alert('Data Invalida', 'Periodo Acima da Data Atual');
      return;
    }

    setPeriodConfig(draftPeriodConfig);
    setPeriodFilter(periodModal);
    setPeriodModal(null);
  };

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesPeriod = isDateInConfiguredPeriod(
      expense.data,
      periodFilter,
      periodConfig
    );
    const normalizedCategory = normalizeCategoryKey(expense.categoria_base);
    const matchesCategory = categoryFilter === 'all'
      || normalizedCategory === categoryFilter;

    return matchesPeriod && matchesCategory;
  }), [categoryFilter, expenses, periodConfig, periodFilter]);

  const total = useMemo(() => filteredExpenses.reduce(
    (acc, current) => acc + Number(current.valor || 0),
    0
  ), [filteredExpenses]);
  const totalTitle = useMemo(
    () => getTotalTitle(periodFilter, categoryFilter),
    [categoryFilter, periodFilter]
  );
  const periodHint = useMemo(
    () => getPeriodHint(periodFilter, periodConfig),
    [periodConfig, periodFilter]
  );

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <View style={styles.totalHeaderRow}>
          <Text style={styles.totalLabel}>{totalTitle}</Text>
          <View style={styles.totalHeaderActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.iconGhostButton}
              onPress={() => setTotalHidden((current) => !current)}
            >
              <Ionicons
                name={totalHidden ? 'eye-off' : 'eye'}
                size={20}
                color={colors.jade}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.iconGhostButton}
              onPress={() => setFiltersVisible((current) => !current)}
            >
              <Ionicons name="filter" size={20} color={colors.jade} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.totalValue}>
          {totalHidden ? 'R$ •••••' : formatCurrency(total)}
        </Text>
        <Text style={styles.totalHint}>
          Gastos manuais e contas ja pagas aparecem conforme periodo e categoria.
        </Text>
        <Text style={styles.totalHint}>{periodHint}</Text>

        {filtersVisible && (
          <View style={styles.filterBlockInline}>
            <Text style={styles.filterTitle}>Periodo</Text>
            <View style={styles.filterRow}>
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  activeOpacity={0.8}
                  onPress={() => openPeriodFilter(period.key)}
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
        )}
      </View>

      <Text style={styles.gestureHint}>
        Dica: arraste um item para a direita para editar ou para a esquerda para excluir.
      </Text>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(periodModal)}
        onRequestClose={closePeriodModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.periodModalBackdrop}
          onPress={closePeriodModal}
        >
          <View
            style={styles.periodModalCard}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.periodModalTitle}>Escolher periodo</Text>

            {periodModal === 'day' && (
              <>
                <Text style={styles.label}>Dia</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.muted}
                  value={draftPeriodConfig.dayDate}
                  onChangeText={(dayDate) => updateDraftPeriodConfig({ dayDate })}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}

            {periodModal === 'week' && (
              <>
                <Text style={styles.label}>Data da semana</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.muted}
                  value={draftPeriodConfig.weekDate}
                  onChangeText={(weekDate) => updateDraftPeriodConfig({ weekDate })}
                  keyboardType="numbers-and-punctuation"
                />

                <Text style={styles.label}>Usar data como</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => updateDraftPeriodConfig({ weekMode: 'start' })}
                    style={[
                      styles.filterChip,
                      draftPeriodConfig.weekMode === 'start' && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        draftPeriodConfig.weekMode === 'start' && styles.filterChipTextActive,
                      ]}
                    >
                      Data inicial
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => updateDraftPeriodConfig({ weekMode: 'end' })}
                    style={[
                      styles.filterChip,
                      draftPeriodConfig.weekMode === 'end' && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        draftPeriodConfig.weekMode === 'end' && styles.filterChipTextActive,
                      ]}
                    >
                      Data final
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {periodModal === 'month' && (
              <>
                <Text style={styles.label}>Mes</Text>
                <View style={styles.monthGrid}>
                  {MONTHS.map((month) => (
                    <TouchableOpacity
                      key={month.key}
                      activeOpacity={0.8}
                      onPress={() => updateDraftPeriodConfig({ month: month.key })}
                      style={[
                        styles.monthOption,
                        Number(draftPeriodConfig.month) === month.key && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          Number(draftPeriodConfig.month) === month.key
                            && styles.filterChipTextActive,
                        ]}
                      >
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Ano</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026"
                  placeholderTextColor={colors.muted}
                  value={draftPeriodConfig.monthYear}
                  onChangeText={(monthYear) => updateDraftPeriodConfig({ monthYear })}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </>
            )}

            {periodModal === 'year' && (
              <>
                <Text style={styles.label}>Ano</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026"
                  placeholderTextColor={colors.muted}
                  value={draftPeriodConfig.year}
                  onChangeText={(year) => updateDraftPeriodConfig({ year })}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </>
            )}

            <View style={styles.periodModalActions}>
              <TouchableOpacity style={styles.outlineButton} onPress={closePeriodModal}>
                <Text style={styles.outlineButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={applyPeriodFilter}>
                <Text style={styles.buttonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
            <ExpenseItem
              item={item}
              onDelete={() => handleDelete(item.id)}
              onEdit={() => handleEdit(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nao existem custos nesse periodo.</Text>
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
