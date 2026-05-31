export const parseCurrencyValue = (valueText) => {
  const normalizedText = String(valueText || '').trim().replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedText)) {
    return Number.NaN;
  }

  const value = Number(normalizedText);

  if (!Number.isFinite(value) || value <= 0) {
    return Number.NaN;
  }

  return Math.round(value * 100) / 100;
};

export const formatCurrency = (value) => {
  const safeValue = Number(value || 0);

  return safeValue.toLocaleString('pt-BR', {
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
  });
};
