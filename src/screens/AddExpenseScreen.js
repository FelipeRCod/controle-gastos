import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { addExpense } from '../database/database';
import { globalStyles } from '../styles/styles';

export default function AddExpenseScreen({ navigation }) {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');

  const handleSave = () => {
    // Verifica se algum campo está vazio (retirando espaços em branco nas pontas)
    if (!descricao.trim() || !categoria.trim() || !valor.trim() || !data.trim()) {
      Alert.alert('Erro de Validação', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Converte o valor digitado para número, permitindo que o usuário use vírgula ou ponto
    const numericValue = parseFloat(valor.replace(',', '.'));

    // Verifica se o valor é um número válido e maior que zero
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Erro de Validação', 'O valor deve ser numérico e maior que zero.');
      return;
    }

    // Salva no banco de dados SQLite
    addExpense(descricao, categoria, numericValue, data);

    // Retorna automaticamente para a Tela Inicial
    navigation.goBack();
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.itemCategory}>Descrição do Gasto</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ex: Conta de Luz"
        value={descricao}
        onChangeText={setDescricao}
      />

      <Text style={globalStyles.itemCategory}>Categoria</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ex: Contas Domésticas"
        value={categoria}
        onChangeText={setCategoria}
      />

      <Text style={globalStyles.itemCategory}>Valor (R$)</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ex: 150.50"
        value={valor}
        onChangeText={setValor}
        keyboardType="numeric"
      />

      <Text style={globalStyles.itemCategory}>Data</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Ex: 29/05/2026"
        value={data}
        onChangeText={setData}
      />

      <TouchableOpacity style={globalStyles.button} onPress={handleSave}>
        <Text style={globalStyles.buttonText}>Salvar Gasto</Text>
      </TouchableOpacity>
    </View>
  );
}