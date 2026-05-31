const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

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
