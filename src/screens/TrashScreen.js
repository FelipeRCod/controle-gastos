import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteTrashItemPermanently,
  getTrashItems,
  restoreTrashItem,
} from '../database/database';
import { useAppTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';

const getTrashDisplayData = (item) => {
  const data = item.origem === 'gasto'
    ? item.payload.expense
    : item.payload.payable;

  return {
    category: data?.categoria,
    date: data?.data || data?.data_vencimento,
    description: data?.descricao,
    originLabel: item.origem === 'gasto' ? 'Gasto' : 'Despesa',
    value: Number(data?.valor || 0),
  };
};

export default function TrashScreen() {
  const { colors, styles } = useAppTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (canUpdate = () => true) => {
    try {
      if (canUpdate()) {
        setLoading(true);
      }

      const data = await getTrashItems();

      if (canUpdate()) {
        setItems(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lixeira:', error);
      if (canUpdate()) {
        Alert.alert('Erro', 'Nao foi possivel carregar a Lixeira.');
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

  const handleRestore = (id) => {
    Alert.alert(
      'Recuperar item',
      'Deseja recuperar este item da Lixeira?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recuperar',
          onPress: async () => {
            try {
              await restoreTrashItem(id);
              await loadData();
            } catch (error) {
              console.error('Erro ao recuperar item:', error);
              Alert.alert('Erro', 'Nao foi possivel recuperar este item.');
            }
          },
        },
      ]
    );
  };

  const handleDeletePermanently = (id) => {
    Alert.alert(
      'Excluir definitivamente',
      'Esta acao nao podera ser desfeita. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrashItemPermanently(id);
              await loadData();
            } catch (error) {
              console.error('Erro ao excluir definitivamente:', error);
              Alert.alert('Erro', 'Nao foi possivel excluir este item.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const data = getTrashDisplayData(item);

    return (
      <View style={styles.trashItem}>
        <View style={styles.itemRow}>
          <View style={styles.itemTitleBox}>
            <View style={styles.itemCategoryIcon}>
              <Ionicons
                name={item.origem === 'gasto' ? 'wallet' : 'alert-circle'}
                size={20}
                color={colors.jade}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{data.description}</Text>
              <Text style={styles.itemCategory}>{data.originLabel} - {data.category}</Text>
            </View>
          </View>
          <Text style={styles.itemValue}>{formatCurrency(data.value)}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemDate}>Data: {data.date}</Text>
          <Text style={styles.itemDate}>
            Expira em: {new Date(item.expira_em).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <View style={styles.trashActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.smallButton}
            onPress={() => handleRestore(item.id)}
          >
            <Text style={styles.smallButtonText}>Recuperar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.dangerButton}
            onPress={() => handleDeletePermanently(item.id)}
          >
            <Text style={styles.dangerButtonText}>Excluir definitivo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Lixeira</Text>
      <Text style={styles.screenSubtitle}>
        Itens excluidos ficam aqui por 30 dias antes da remocao automatica.
      </Text>

      {loading ? (
        <View style={styles.listLoadingContainer}>
          <ActivityIndicator size="small" color={colors.jade} />
          <Text style={styles.loadingText}>Carregando lixeira...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum item na Lixeira.</Text>
          }
        />
      )}
    </View>
  );
}
