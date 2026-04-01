const now = () => new Date().toISOString();

const store = {
  fields: [
    {
      id: "field-1",
      name: "Северное поле",
      areaHa: 45,
      crop: "Пшеница",
      location: { lat: 59.95, lon: 30.31 }
    },
    {
      id: "field-2",
      name: "Южный сектор",
      areaHa: 32,
      crop: "Кукуруза",
      location: { lat: 59.91, lon: 30.44 }
    }
  ],
  sensors: [
    { id: "s-101", fieldId: "field-1", type: "soil_moisture", unit: "%" },
    { id: "s-102", fieldId: "field-1", type: "air_temperature", unit: "C" },
    { id: "s-201", fieldId: "field-2", type: "soil_moisture", unit: "%" },
    { id: "s-202", fieldId: "field-2", type: "leaf_health_index", unit: "index" }
  ],
  telemetry: [],
  recommendations: [],
  tasks: []
};

function seedTelemetry() {
  const samples = [
    { sensorId: "s-101", fieldId: "field-1", metric: "soil_moisture", value: 24.1 },
    { sensorId: "s-102", fieldId: "field-1", metric: "air_temperature", value: 30.4 },
    { sensorId: "s-201", fieldId: "field-2", metric: "soil_moisture", value: 36.9 },
    { sensorId: "s-202", fieldId: "field-2", metric: "leaf_health_index", value: 0.72 }
  ];

  samples.forEach((sample, idx) => {
    store.telemetry.push({
      id: `t-${idx + 1}`,
      ...sample,
      timestamp: now()
    });
  });
}

seedTelemetry();

export function listFields() {
  return store.fields;
}

export function listTelemetryByField(fieldId) {
  return store.telemetry.filter((item) => item.fieldId === fieldId);
}

export function addTelemetry(payload) {
  const record = {
    id: `t-${store.telemetry.length + 1}`,
    sensorId: payload.sensorId,
    fieldId: payload.fieldId,
    metric: payload.metric,
    value: Number(payload.value),
    timestamp: payload.timestamp || now()
  };
  store.telemetry.push(record);
  return record;
}

export function addRecommendation(data) {
  const recommendation = {
    id: `r-${store.recommendations.length + 1}`,
    fieldId: data.fieldId,
    source: data.source,
    text: data.text,
    actions: data.actions,
    createdAt: now()
  };

  store.recommendations.push(recommendation);
  return recommendation;
}

export function getFieldSummary(fieldId) {
  const field = store.fields.find((f) => f.id === fieldId);
  if (!field) {
    return null;
  }

  const telemetry = listTelemetryByField(fieldId);
  const grouped = telemetry.reduce((acc, item) => {
    acc[item.metric] ||= [];
    acc[item.metric].push(item.value);
    return acc;
  }, {});

  const metrics = Object.entries(grouped).map(([metric, values]) => {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return { metric, avg: Number(avg.toFixed(2)), last: values.at(-1) };
  });

  return { field, metrics, telemetryCount: telemetry.length };
}

export function getStoreSnapshot() {
  return JSON.parse(JSON.stringify(store));
}
