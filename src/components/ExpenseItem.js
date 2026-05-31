import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../styles/styles';

export default function ExpenseItem({ item, onLongPress }) {
  const value = Number(item.valor || 0);

  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={globalStyles.listItem}>
        <View style={globalStyles.itemRow}>
          <Text style={globalStyles.itemTitle}>{item.descricao}</Text>
          <Text style={globalStyles.itemValue}>R$ {value.toFixed(2)}</Text>
        </View>
        <View style={globalStyles.itemRow}>
          <Text style={globalStyles.itemCategory}>{item.categoria}</Text>
          <Text style={globalStyles.itemDate}>{item.data}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
