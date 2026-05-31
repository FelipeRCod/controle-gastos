import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';

const SWIPE_LIMIT = 78;

export default function SwipeableActionItem({ children, onDelete, onEdit }) {
  const { colors, styles } = useAppTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    currentX.current = 0;
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => (
      Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
    ),
    onPanResponderMove: (_, gestureState) => {
      const nextX = Math.max(-110, Math.min(110, gestureState.dx));
      currentX.current = nextX;
      translateX.setValue(nextX);
    },
    onPanResponderRelease: () => {
      if (currentX.current >= SWIPE_LIMIT) {
        resetPosition();
        onEdit?.();
        return;
      }

      if (currentX.current <= -SWIPE_LIMIT) {
        resetPosition();
        onDelete?.();
        return;
      }

      resetPosition();
    },
    onPanResponderTerminate: resetPosition,
  })).current;

  return (
    <View style={styles.swipeItemShell}>
      <View style={styles.swipeActionsBack}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onEdit}
          style={[styles.swipeAction, styles.swipeEditAction]}
        >
          <Ionicons name="create" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDelete}
          style={[styles.swipeAction, styles.swipeDeleteAction]}
        >
          <Ionicons name="trash" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeItemFront,
          { transform: [{ translateX }] },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
