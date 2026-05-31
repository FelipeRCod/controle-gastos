import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryByKey } from '../constants/categories';
import SwipeableActionItem from './SwipeableActionItem';
import { useAppTheme } from '../theme/ThemeContext';
import { formatCurrency } from '../utils/currency';

export default function PayableItem({ item, onDelete, onEdit, onMarkAsPaid }) {
  const { styles } = useAppTheme();
  const value = Number(item.valor || 0);
  const isPaid = item.status === 'paga';
  const category = getCategoryByKey(item.categoria_base);

  return (
    <SwipeableActionItem onDelete={onDelete} onEdit={onEdit}>
      <View style={[styles.listItem, { borderLeftColor: category.color }]}>
        <View style={styles.itemRow}>
          <View style={styles.itemTitleBox}>
            <View style={[styles.itemCategoryIcon, { backgroundColor: `${category.color}22` }]}>
              <Ionicons name={category.icon} size={20} color={category.color} />
            </View>
            <Text style={styles.itemTitle}>{item.descricao}</Text>
          </View>
          <Text style={styles.itemValue}>{formatCurrency(value)}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={[styles.itemCategoryChip, { borderColor: category.color, color: category.color }]}>
            {item.categoria}
          </Text>
          <Text style={styles.itemDate}>Vence: {item.data_vencimento}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={isPaid ? styles.statusPaid : styles.statusPending}>
            {isPaid ? 'Paga' : 'Pendente'}
          </Text>
          {isPaid ? (
            <Text style={styles.itemDate}>Pago em: {item.data_pagamento}</Text>
          ) : (
            <TouchableOpacity style={styles.smallButton} onPress={onMarkAsPaid}>
              <Text style={styles.smallButtonText}>Marcar como paga</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SwipeableActionItem>
  );
}
