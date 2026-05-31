import React, { useState, useCallback } from 'react';
import { ActivityIndicator, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExpenses, deleteExpense } from '../database/database';
import ExpenseItem from '../components/ExpenseItem';
import { globalStyles } from '../styles/styles';

export default function HomeScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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

      // Calcula o total somando o valor de todos os itens da lista
      const totalAmount = data.reduce(
        (acc, current) => acc + Number(current.valor || 0),
        0
      );
      setTotal(totalAmount);
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
      "Excluir Gasto",
      "Tem certeza que deseja apagar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(id);
              await loadData(); // Recarrega a lista e o total após deletar
            } catch (error) {
              console.error('Erro ao excluir gasto:', error);
              Alert.alert('Erro', 'Nao foi possivel excluir este gasto.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <ExpenseItem item={item} onLongPress={() => handleDelete(item.id)} />
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.totalCard}>
        <Text style={globalStyles.totalLabel}>Gasto Total:</Text>
        <Text style={globalStyles.totalValue}>R$ {total.toFixed(2)}</Text>
      </View>

      {loading ? (
        <View style={globalStyles.listLoadingContainer}>
          <ActivityIndicator size="small" color="#28A745" />
          <Text style={globalStyles.loadingText}>Carregando gastos...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={globalStyles.emptyText}>Nenhum gasto cadastrado.</Text>
          }
        />
      )}
      
      <TouchableOpacity 
        style={globalStyles.button} 
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={globalStyles.buttonText}>+ Novo Gasto</Text>
      </TouchableOpacity>
    </View>
  );
}
