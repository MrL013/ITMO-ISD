# AgroVision Prototype

В этом репозитории собран прототип информационной системы `AgroVision`:
- сценарии и структура системы на базе LLM;
- веб-сервис (backend + frontend);
- тестирование и анализ качества/производительности.

## Запуск

```bash
npm start
```

Открыть: `http://localhost:3000`

## Тесты

```bash
npm test
```

## Производительность

```bash
npm run bench
```

Параметры:
- `BENCH_REQUESTS` (по умолчанию `200`)
- `BENCH_CONCURRENCY` (по умолчанию `20`)

## Документация

- `docs/01_scenarios_architecture.md`
- `docs/02_data_model.md`
- `docs/03_testing_analysis.md`
