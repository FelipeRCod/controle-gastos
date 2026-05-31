import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PayableItem from '../components/PayableItem';
import { getPayables, markPayableAsPaid } from '../database/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';

export default function PayablesScreen({ navigation }) {
  const { colors, styles } = useAppTheme();
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const pendingTotal = payables
    .filter((item) => item.status === 'pendente')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Despesas Pendentes</Text>
        <Text style={styles.totalValue}>{formatCurrency(pendingTotal)}</Text>
        <Text style={styles.totalHint}>
          So entram nos gastos quando voce marcar como pagas.
        </Text>
      </View>

      {loading ? (
        <View style={styles.listLoadingContainer}>
          <ActivityIndicator size="small" color={colors.jade} />
          <Text style={styles.loadingText}>Carregando despesas...</Text>
        </View>
      ) : (
        <FlatList
          data={payables}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PayableItem item={item} onMarkAsPaid={() => handleMarkAsPaid(item.id)} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma despesa cadastrada.</Text>
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
