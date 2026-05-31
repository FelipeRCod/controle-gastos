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
import PayableItem from '../components/PayableItem';
import {
  EXPENSE_CATEGORIES,
  getCategoryByKey,
  normalizeCategoryKey,
} from '../constants/categories';
import { getPayables, markPayableAsPaid, movePayableToTrash } from '../database/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';
import {
  formatBrazilianDate,
  getConfiguredPeriodRange,
  isDateInConfiguredPeriod,
  isValidBrazilianDate,
  MONTHS,
  PERIODS,
} from '../utils/dateFilters';

const PERIOD_TOTAL_LABELS = {
  day: 'do dia',
  week: 'da semana',
  month: 'do mes',
  year: 'do ano',
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

const getTotalTitle = (periodFilter, categoryFilter) => {
  const isAllPeriods = periodFilter === 'all';
  const isAllCategories = categoryFilter === 'all';

  if (isAllPeriods && isAllCategories) {
    return 'Despesas Pendentes';
  }

  if (isAllPeriods) {
    return `Despesas Pendentes ${getCategoryByKey(categoryFilter).label}`;
  }

  const periodLabel = PERIOD_TOTAL_LABELS[periodFilter] || '';

  if (isAllCategories) {
    return `Despesas Pendentes ${periodLabel}`;
  }

  return `Despesas Pendentes ${periodLabel} com ${getCategoryByKey(categoryFilter).label}`;
};

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

export default function PayablesScreen({ navigation }) {
  const { colors, styles } = useAppTheme();
  const [payables, setPayables] = useState([]);
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

      const data = await getPayables();

      if (!canUpdate()) {
        return;
      }

      setPayables(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      if (canUpdate()) {
        Alert.alert('Erro', 'Nao foi possivel carregar as despesas.');
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

    setPeriodConfig(draftPeriodConfig);
    setPeriodFilter(periodModal);
    setPeriodModal(null);
  };

  const handleMarkAsPaid = (id) => {
    Alert.alert(
      'Marcar como paga',
      'Esta despesa sera adicionada ao controle de gastos. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await markPayableAsPaid(id);
              await loadData();
              navigation.navigate('Home');
              Alert.alert('Sucesso', 'Despesa paga e adicionada aos gastos.');
            } catch (error) {
              console.error('Erro ao pagar despesa:', error);
              Alert.alert('Erro', 'Nao foi possivel marcar esta despesa como paga.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Excluir Despesa',
      'Deseja mesmo excluir este item? Ele ficara na Lixeira por 30 dias.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await movePayableToTrash(id);
              await loadData();
            } catch (error) {
              console.error('Erro ao excluir despesa:', error);
              Alert.alert('Erro', 'Nao foi possivel excluir esta despesa.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    Alert.alert(
      'Editar Despesa',
      'Deseja mesmo editar este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Editar',
          onPress: () => navigation.navigate('EditPayable', { item }),
        },
      ]
    );
  };

  const filteredPayables = useMemo(() => payables.filter((payable) => {
    const matchesPeriod = isDateInConfiguredPeriod(
      payable.data_vencimento,
      periodFilter,
      periodConfig
    );
    const normalizedCategory = normalizeCategoryKey(payable.categoria_base);
    const matchesCategory = categoryFilter === 'all'
      || normalizedCategory === categoryFilter;

    return matchesPeriod && matchesCategory;
  }), [categoryFilter, payables, periodConfig, periodFilter]);

  const pendingTotal = useMemo(() => filteredPayables
    .filter((item) => item.status === 'pendente')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0), [filteredPayables]);
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
          {totalHidden ? 'R$ .....' : formatCurrency(pendingTotal)}
        </Text>
        <Text style={styles.totalHint}>
          So entram nos gastos quando voce marcar como pagas.
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
        Dica: arraste uma despesa para a direita para editar ou para a esquerda para excluir.
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
          <Text style={styles.loadingText}>Carregando despesas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayables}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PayableItem
              item={item}
              onDelete={() => handleDelete(item.id)}
              onEdit={() => handleEdit(item)}
              onMarkAsPaid={() => handleMarkAsPaid(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma despesa encontrada nesse filtro.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddPayable')}
      >
        <Text style={styles.buttonText}>+ Nova Despesa</Text>
      </TouchableOpacity>
    </View>
  );
}
