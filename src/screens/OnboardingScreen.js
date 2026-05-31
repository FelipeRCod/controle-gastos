import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BrandLogo from '../components/BrandLogo';
import { useAppTheme } from '../theme/ThemeContext';

const steps = [
  {
    title: 'Comece pela tela inicial',
    text: 'A tela inicial mostra os atalhos para Controle de Gastos e Controle de Despesas.',
  },
  {
    title: 'Controle seus gastos',
    text: 'Cadastre gastos ja realizados, filtre por periodo ou categoria e acompanhe o total.',
  },
  {
    title: 'Planeje despesas futuras',
    text: 'No Controle de Despesas, cadastre despesas pendentes sem misturar com os gastos pagos.',
  },
  {
    title: 'Pague e registre',
    text: 'Quando marcar uma despesa como paga, ela entra automaticamente no Controle de Gastos.',
  },
  {
    title: 'Edite ou exclua com gesto',
    text: 'Arraste um gasto ou despesa para a direita para editar. Arraste para a esquerda para excluir e enviar para a Lixeira.',
  },
];

export default function OnboardingScreen({ onFinish }) {
  const { styles } = useAppTheme();
  const [index, setIndex] = useState(0);
  const currentStep = steps[index];
  const isLastStep = index === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
      return;
    }

    setIndex((current) => current + 1);
  };

  return (
    <View style={styles.onboardingContainer}>
      <BrandLogo size="large" />

      <View style={styles.onboardingCard}>
        <Text style={styles.onboardingCounter}>
          Passo {index + 1} de {steps.length}
        </Text>
        <Text style={styles.onboardingTitle}>{currentStep.title}</Text>
        <Text style={styles.onboardingText}>{currentStep.text}</Text>

        <View style={styles.dotsRow}>
          {steps.map((step, stepIndex) => (
            <View
              key={step.title}
              style={
                stepIndex === index
                  ? styles.dotActive
                  : styles.dot
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.onboardingActions}>
        <TouchableOpacity style={styles.outlineButton} onPress={onFinish}>
          <Text style={styles.outlineButtonText}>Pular</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLastStep ? 'Comecar' : 'Proximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
