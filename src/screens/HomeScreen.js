import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExpenses, deleteExpense } from '../database/database';
import { globalStyles } from '../styles/styles';

export default function HomeScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);

  const loadData = () => {
    const data = getExpenses();
    setExpenses(data);
    
    // Calcula o total somando o valor de todos os itens da lista
    const totalAmount = data.reduce((acc, current) => acc + current.valor, 0);
    setTotal(totalAmount);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
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
          onPress: () => {
            deleteExpense(id);
            loadData(); // Recarrega a lista e o total após deletar
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onLongPress={() => handleDelete(item.id)} activeOpacity={0.7}>
      <View style={globalStyles.listItem}>
        <View style={globalStyles.itemRow}>
          <Text style={globalStyles.itemTitle}>{item.descricao}</Text>
          <Text style={globalStyles.itemValue}>R$ {item.valor.toFixed(2)}</Text>
        </View>
        <View style={globalStyles.itemRow}>
          <Text style={globalStyles.itemCategory}>{item.categoria}</Text>
          <Text style={globalStyles.itemDate}>{item.data}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <View style={{ backgroundColor: '#28A745', padding: 15, borderRadius: 8, marginBottom: 15 }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Gasto Total:</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>R$ {total.toFixed(2)}</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum gasto cadastrado.</Text>}
      />
      
      <TouchableOpacity 
        style={globalStyles.button} 
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={globalStyles.buttonText}>+ Novo Gasto</Text>
      </TouchableOpacity>
    </View>
  );
}