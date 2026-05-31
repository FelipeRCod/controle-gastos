const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export const MONTHS = [
  { key: 0, label: 'Janeiro' },
  { key: 1, label: 'Fevereiro' },
  { key: 2, label: 'Março' },
  { key: 3, label: 'Abril' },
  { key: 4, label: 'Maio' },
  { key: 5, label: 'Junho' },
  { key: 6, label: 'Julho' },
  { key: 7, label: 'Agosto' },
  { key: 8, label: 'Setembro' },
  { key: 9, label: 'Outubro' },
  { key: 10, label: 'Novembro' },
  { key: 11, label: 'Dezembro' },
];

export const PERIODS = [
  { key: 'all', label: 'Todos' },
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
];

export const isValidBrazilianDate = (dateText) => {
  const match = DATE_PATTERN.exec(String(dateText || '').trim());

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  );
};

export const parseBrazilianDate = (dateText) => {
  if (!isValidBrazilianDate(dateText)) {
    return null;
  }

  const [, day, month, year] = DATE_PATTERN.exec(String(dateText).trim());
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatBrazilianDate = (date) => date.toLocaleDateString('pt-BR');

const startOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate()
);

const endOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  23,
  59,
  59,
  999
);

const addDays = (date, amount) => {
  const nextDate = startOfDay(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const getPeriodRange = (periodKey, referenceDate = new Date()) => {
  const currentDate = startOfDay(referenceDate);

  if (periodKey === 'day') {
    return { end: endOfDay(currentDate), start: currentDate };
  }

  if (periodKey === 'week') {
    const day = currentDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() + diffToMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { end: endOfDay(end), start };
  }

  if (periodKey === 'year') {
    return {
      end: new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999),
      start: new Date(currentDate.getFullYear(), 0, 1),
    };
  }

  return {
    end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999),
    start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
  };
};

export const getConfiguredPeriodRange = (periodKey, periodConfig = {}) => {
  if (periodKey === 'all') {
    return null;
  }

  if (periodKey === 'day') {
    const date = parseBrazilianDate(periodConfig.dayDate);
    return date ? { end: endOfDay(date), start: startOfDay(date) } : null;
  }

  if (periodKey === 'week') {
    const date = parseBrazilianDate(periodConfig.weekDate);

    if (!date) {
      return null;
    }

    if (periodConfig.weekMode === 'end') {
      return {
        end: endOfDay(date),
        start: addDays(date, -6),
      };
    }

    return {
      end: endOfDay(addDays(date, 6)),
      start: startOfDay(date),
    };
  }

  if (periodKey === 'month') {
    const year = Number(periodConfig.monthYear);
    const month = Number(periodConfig.month);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return null;
    }

    return {
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      start: new Date(year, month, 1),
    };
  }

  if (periodKey === 'year') {
    const year = Number(periodConfig.year);

    if (!Number.isInteger(year)) {
      return null;
    }

    return {
      end: new Date(year, 11, 31, 23, 59, 59, 999),
      start: new Date(year, 0, 1),
    };
  }

  return null;
};

export const isDateInPeriod = (dateText, periodKey) => {
  if (periodKey === 'all') {
    return true;
  }

  const date = parseBrazilianDate(dateText);

  if (!date) {
    return false;
  }

  const { end, start } = getPeriodRange(periodKey);
  return date >= start && date <= end;
};

export const isDateInConfiguredPeriod = (dateText, periodKey, periodConfig) => {
  if (periodKey === 'all') {
    return true;
  }

  const date = parseBrazilianDate(dateText);
  const range = getConfiguredPeriodRange(periodKey, periodConfig);

  if (!date || !range) {
    return false;
  }

  return date >= range.start && date <= range.end;
};

export const isPeriodAboveToday = (periodKey, periodConfig = {}) => {
  if (periodKey === 'all') {
    return false;
  }

  const today = new Date();

  if (periodKey === 'month') {
    const selectedYear = Number(periodConfig.monthYear);
    const selectedMonth = Number(periodConfig.month);

    return (
      selectedYear > today.getFullYear()
      || (
        selectedYear === today.getFullYear()
        && selectedMonth > today.getMonth()
      )
    );
  }

  if (periodKey === 'year') {
    return Number(periodConfig.year) > today.getFullYear();
  }

  const range = getConfiguredPeriodRange(periodKey, periodConfig);

  if (!range) {
    return false;
  }

  return range.end > endOfDay(today);
};
