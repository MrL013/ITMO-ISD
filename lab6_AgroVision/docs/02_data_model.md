# Этап 1. Структура данных AgroVision

## 1) Основные сущности

1. `Field` (поле):
- `id: string`
- `name: string`
- `areaHa: number`
- `crop: string`
- `location: { lat: number, lon: number }`

2. `Sensor` (датчик):
- `id: string`
- `fieldId: string`
- `type: string`
- `unit: string`

3. `TelemetryRecord` (телеметрия):
- `id: string`
- `sensorId: string`
- `fieldId: string`
- `metric: string`
- `value: number`
- `timestamp: ISO datetime`

4. `Recommendation` (рекомендация):
- `id: string`
- `fieldId: string`
- `source: "openai" | "fallback"`
- `text: string`
- `actions: string[]`
- `createdAt: ISO datetime`

5. `Task` (операционная задача, в прототипе зарезервирована):
- `id: string`
- `fieldId: string`
- `type: "irrigation" | "drone_mission" | "inspection"`
- `priority: "low" | "medium" | "high"`
- `status: "new" | "in_progress" | "done"`

## 2) API-контракты прототипа

1. `GET /api/fields`
- Ответ: список полей.

2. `GET /api/fields/:id/summary`
- Ответ: поле + агрегированные метрики (`avg`, `last`) + число записей.

3. `POST /api/telemetry`
- Вход: `{ sensorId, fieldId, metric, value, timestamp? }`
- Выход: созданная запись телеметрии.

4. `POST /api/recommendation`
- Вход: `{ fieldId }`
- Выход: рекомендация + актуальная сводка поля.

## 3) Поток данных (упрощенно)
1. Датчики -> `TelemetryRecord`
2. Агрегатор -> `FieldSummary`
3. `FieldSummary` -> LLM prompt
4. LLM output -> `Recommendation`
5. Рекомендация -> UI оператора

## 4) Масштабируемый вариант хранения (для следующей версии)
- Временные ряды телеметрии: TimescaleDB/InfluxDB.
- Операционные сущности и справочники: PostgreSQL.
- Геоданные полей/маршрутов: PostGIS.
- События интеграции: Kafka/RabbitMQ.
- Кэш оперативных сводок: Redis.
