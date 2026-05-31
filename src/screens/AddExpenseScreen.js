import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { addExpense } from '../database/database';
import { globalStyles } from '../styles/styles';

export default function AddExpenseScreen({ navigation }) {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const descricaoTratada = descricao.trim();
    const categoriaTratada = categoria.trim();
    const valorTratado = valor.trim();
    const dataTratada = data.trim();

    // Verifica se algum campo está vazio (retirando espaços em branco nas pontas)
    if (!descricaoTratada || !categoriaTratada || !valorTratado || !dataTratada) {
      Alert.alert('Erro de Validacao', 'Por favor, preencha todos os campos obrigatorios.');
      return;
    }

    // Converte o valor digitado para número, permitindo que o usuário use vírgula ou ponto
    const numericValue = parseFloat(valorTratado.replace(',', '.'));

    // Verifica se o valor é um número válido e maior que zero
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Erro de Validacao', 'O valor deve ser numerico e maior que zero.');
      return;
    }

    try {
      setSaving(true);

      // Salva no banco de dados SQLite
      await addExpense(descricaoTratada, categoriaTratada, numericValue, dataTratada);

      // Retorna automaticamente para a Tela Inicial
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar este gasto.');
    } finally {
      setSaving(false);
    }
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

      <TouchableOpacity
        style={[globalStyles.button, saving && globalStyles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={globalStyles.buttonText}>
          {saving ? 'Salvando...' : 'Salvar Gasto'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
