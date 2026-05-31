import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import CategoryPicker from '../components/CategoryPicker';
import { CATEGORY_KEYS } from '../constants/categories';
import { addPayable } from '../database/database';
import { useAppTheme } from '../theme/ThemeContext';
import { parseCurrencyValue } from '../utils/currency';
import { isValidBrazilianDate } from '../utils/dateFilters';

export default function AddPayableScreen({ navigation }) {
  const { colors, styles } = useAppTheme();
  const [descricao, setDescricao] = useState('');
  const [categoriaBase, setCategoriaBase] = useState('');
  const [categoriaOutros, setCategoriaOutros] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const descricaoTratada = descricao.trim();
    const categoriaOutrosTratada = categoriaOutros.trim();
    const categoriaTratada = categoriaBase === CATEGORY_KEYS.OTHER
      ? categoriaOutrosTratada
      : '';
    const valorTratado = valor.trim();
    const dataTratada = dataVencimento.trim();

    if (!descricaoTratada || !categoriaBase || !valorTratado || !dataTratada) {
      Alert.alert('Erro de Validacao', 'Preencha todos os campos da despesa.');
      return;
    }

    if (categoriaBase === CATEGORY_KEYS.OTHER && !categoriaOutrosTratada) {
      Alert.alert('Erro de Validacao', 'Informe o tipo de custo em Outros.');
      return;
    }

    const numericValue = parseCurrencyValue(valorTratado);

    if (isNaN(numericValue)) {
      Alert.alert(
        'Erro de Validacao',
        'Informe um valor maior que zero. Use 300, 300,25 ou 300.25.'
      );
      return;
    }

    if (!isValidBrazilianDate(dataTratada)) {
      Alert.alert('Erro de Validacao', 'Informe a data de vencimento no formato DD/MM/AAAA.');
      return;
    }

    try {
      setSaving(true);
      await addPayable(
        descricaoTratada,
        categoriaBase,
        categoriaTratada,
        numericValue,
        dataTratada
      );
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao cadastrar despesa:', error);
      Alert.alert('Erro', 'Nao foi possivel cadastrar esta despesa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formKeyboardContainer}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formScrollContent}
      >
        <Text style={styles.screenTitle}>Cadastrar despesa</Text>
        <Text style={styles.screenSubtitle}>
          Ela fica pendente e so entra nos gastos quando for paga.
        </Text>

        <Text style={styles.label}>Descricao da Despesa</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Internet"
          placeholderTextColor={colors.muted}
          value={descricao}
          onChangeText={setDescricao}
          returnKeyType="next"
        />

        <Text style={styles.label}>Categoria</Text>
        <CategoryPicker
          selectedCategory={categoriaBase}
          onSelect={setCategoriaBase}
        />

        {categoriaBase === CATEGORY_KEYS.OTHER && (
          <>
            <Text style={styles.label}>Tipo de custo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Farmacia"
              placeholderTextColor={colors.muted}
              value={categoriaOutros}
              onChangeText={setCategoriaOutros}
              returnKeyType="next"
            />
          </>
        )}

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 300 ou 300,25"
          placeholderTextColor={colors.muted}
          value={valor}
          onChangeText={setValor}
          keyboardType="numeric"
          returnKeyType="next"
        />

        <Text style={styles.label}>Data de Vencimento</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.muted}
          value={dataVencimento}
          onChangeText={setDataVencimento}
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Salvando...' : 'Salvar Despesa'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
