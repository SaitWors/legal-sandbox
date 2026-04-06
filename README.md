<<<<<<< HEAD
﻿# Legal Sandbox — песочница для юридических правок

Одностраничное приложение, которое позволяет загрузить/вставить текст договора, разрезать его на пункты и **найти дубли и конфликты** между ними.

---

## Демо (как пользоваться)

1. Открой страницу **`/legal/sandbox`**.
2. Нажми **«Демо-текст»** или вставь свой текст/загрузи `.txt/.md`.
3. Нажми **«Сегментировать»** — текст разобьётся на пункты.
4. Нажми **«Найти конфликты и дубли»** — появится список находок.
5. Пройдись по находкам:

   * кнопка **«К пунктам»** — скроллит/подсвечивает нужные пункты;
   * **порог дублей** (например, 0.85 → 0.92) — влияет на результат;
   * **«Отметить решённым»** и тумблер **«Показывать решённые»**.
6. Экспортируй отчёт: **Markdown** или **JSON**.

> Введённый текст кешируется в `localStorage` и восстанавливается при обновлении страницы.

---

## Требования к окружению

* **Node.js 20+**, **npm 10+**
* **Python 3.11+**
* Git, GitHub аккаунт
* **Windows:** проект лучше держать по пути **без пробелов и не-ASCII** символов
  (например: `C:\dev\legal-sandbox`)

---

## Быстрый старт

```bash
# клонирование
git clone https://github.com/<you>/legal-sandbox.git
cd legal-sandbox

# фронтенд
cd apps/frontend
npm ci
npm run dev
# открой http://localhost:3000/legal/sandbox
```

> **PowerShell (Windows)**: те же команды. Если будет паника Turbopack, см. раздел «Известные проблемы (Windows)».

---

## Структура проекта

```
legal-sandbox/
  apps/
    frontend/            # Next.js + Tailwind + shadcn/ui — ЛР-1
      src/
        app/legal/sandbox/page.tsx
        components/legal/LegalSandbox.tsx
        components/ui/...           # shadcn/ui
      package.json
      tsconfig.json
  services/
    api/                  # ЛР-2 — FastAPI (каркас)
      app/...
  docs/
    requirements-lr1.md   # FR/NFR для ЛР-1
  .github/workflows/
    frontend.yml          # CI для фронта
    api.yml               # CI для API (к ЛР-2)
  README.md
  .gitignore
```

---

## Скрипты

В `apps/frontend/package.json`:

* `npm run dev` — запуск dev-сервера
* `npm run build` — прод-сборка
* `npm run start` — запуск прод-сборки
* `npm run lint` — линтинг (если настроен)

---

## Функциональность (ЛР-1)

* Вставка и загрузка `.txt/.md`
* Сегментация текста на пункты (заголовки, абзацы, fallback по предложениям)
* Поиск **дублей** (Jaccard по токенам без RU-стоп-слов)
* Поиск **конфликтов** (эвристики: разрешено/запрещено, должен/может vs не-, различия чисел/сроков)
* Навигация «К пунктам», подсветка выбранных
* Пометка «решено», фильтр «показывать решённые»
* Экспорт **Markdown** и **JSON**
* Кеширование текста в `localStorage`
* Готовность к интеграции с API (функция `handleAnalyzeServer`)

Подробные **FR/NFR** — в `docs/requirements-lr1.md`.

---

## Требования (FR/NFR)

Документ: **[`docs/requirements-lr1.md`](docs/requirements-lr1.md)**
Включает:

* **Функциональные требования (FR)** — ввод/сегментация/анализ/экспорт/навигация/состояние
* **Нефункциональные (NFR)** — производительность, устойчивость, UX/A11y, безопасность, окружение, качество кода, CI

---

## CI (GitHub Actions)

Минимальный пайплайн для фронта (лежит в `.github/workflows/frontend.yml`):

```yaml
name: frontend
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run lint --if-present
```

**Структура (FastAPI):**

```
services/api/
  app/
    main.py                 # create_app() + подключение роутов
    api/v1/routes.py        # /health, /segment, /analyze (заглушки)
    models/dto.py           # Pydantic-схемы (Clause/Finding/AnalyzeRequest/Response)
    services/analyzer.py    # TODO: segmentation(), detect_*()
  tests/
    test_health.py
```

**Запуск:**

```bash
cd services/api
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# *nix:    source .venv/bin/activate
pip install fastapi uvicorn pydantic[dotenv] pytest
uvicorn app.main:app --reload
# -> http://127.0.0.1:8000/api/v1/health
```

**Связка с фронтом:** во `LegalSandbox.tsx` уже есть `handleAnalyzeServer` — можно направить `fetch` на `/api/v1/analyze` и пока принимать `{ findings: [] }`.

---

## Известные проблемы (Windows)

* **Путь с кириллицей/пробелами (OneDrive/«Рабочий стол»)** может ломать Turbopack в dev-режиме.
  Рекомендации:

  1. перемести проект, например, в `C:\dev\legal-sandbox`;
  2. если dev всё равно падает — запускай без Turbopack:

     ```bash
     next dev --no-turbo
     ```
* PowerShell ≠ Bash: команды вида `mkdir -p` не работают. Используй:

  ```powershell
  New-Item -Path "src\app\legal\sandbox" -ItemType Directory -Force
  ```

---
=======
# Legal Sandbox

Product-style fullstack MVP for contract review and document operations.

## Stack

- **Frontend:** Next.js + React + TypeScript
- **Backend:** FastAPI + SQLModel
- **Auth:** access token + rotating refresh token
- **Storage:** local filesystem or S3-compatible object storage (MinIO in Docker)
- **Infra:** Docker Compose + Nginx + PostgreSQL + MinIO

## What is implemented

### Labs 1–3

- **RBAC:** roles `user`, `manager`, `admin`
- **Protected routes:** `/legal/sandbox` requires auth, `/admin/users` requires admin
- **Role-aware UI:** hidden/admin-only actions and role management page
- **Access + refresh auth:** login, refresh, logout, current user, refresh token rotation and revocation
- **Layered backend:** API → service → repository
- **Document registry:** CRUD, filtering, search, sort, pagination
- **File attachments:** upload, list, protected download link, delete
- **Validation and error handling:** on client and server

### Docker lab

- FastAPI Dockerfile
- Next.js Dockerfile (standalone build)
- `docker-compose.yml` with `frontend`, `api`, `postgres`, `minio`, `nginx`
- healthchecks and environment-driven configuration

## Role matrix

| Role | Documents | Files | Users/Roles |
|------|-----------|-------|-------------|
| user | CRUD only own | CRUD only own | no access |
| manager | read all, update all, delete own | read/delete all, upload via document access | no access |
| admin | full access | full access | list users, change roles |

## Local run

### API

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd apps/frontend
npm ci
npm run dev
```

## Docker run

```bash
docker compose up --build
```

Open:

- App: `http://localhost`
- MinIO Console: `http://localhost:9001` (if port is exposed manually later)

## Notes

- First registered user becomes `admin`
- Default local API base on frontend is `/api/v1`
- To reset schema locally, set `LS_RESET_DB_ON_START=1`
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
