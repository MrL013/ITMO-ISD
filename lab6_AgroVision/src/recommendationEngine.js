function heuristicActions(context) {
  const actions = [];

  if (context.soil_moisture !== null && context.soil_moisture < 28) {
    actions.push("Запустить капельный полив на 25-35 минут в течение 2 часов");
  }

  if (context.air_temperature !== null && context.air_temperature > 30) {
    actions.push("Сдвинуть полевые работы на утреннее окно до 10:00");
  }

  if (context.leaf_health_index !== null && context.leaf_health_index < 0.75) {
    actions.push("Запланировать дрон-облет для диагностики стресс-зон растений");
  }

  if (actions.length === 0) {
    actions.push("Поддерживать текущий режим, повторная проверка через 6 часов");
  }

  return actions;
}

export function buildRecommendationPrompt(summary) {
  const metricsText = summary.metrics
    .map((m) => `${m.metric}: среднее ${m.avg}, последнее ${m.last}`)
    .join("; ");

  return [
    "Ты агрономический ИИ-помощник в системе AgroVision.",
    `Поле: ${summary.field.name}, культура: ${summary.field.crop}, площадь: ${summary.field.areaHa} га.`,
    `Метрики: ${metricsText}.`,
    "Дай короткую рекомендацию на ближайшие 24 часа и перечисли 2-4 действия.",
    "Формат: сначала вывод, потом список действий через ';'."
  ].join(" ");
}

export function fallbackRecommendation(summary) {
  const getMetric = (name) => {
    const row = summary.metrics.find((m) => m.metric === name);
    return row ? Number(row.last) : null;
  };

  const context = {
    soil_moisture: getMetric("soil_moisture"),
    air_temperature: getMetric("air_temperature"),
    leaf_health_index: getMetric("leaf_health_index")
  };

  const actions = heuristicActions(context);
  const text = `Режим для поля '${summary.field.name}': приоритет - сохранить влажность и снизить стресс растений.`;

  return { text, actions };
}
