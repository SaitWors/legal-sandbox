# Как убрать конфликты в Pull Request

Проблема на скрине не в Docker. В PR-ветке остались конфликтные версии файлов и/или конфликтные маркеры Git:

```txt
< < < < < < < HEAD
= = = = = = =
> > > > > > > branch-name
```

В этой версии проекта файлы уже приведены к рабочему состоянию:

- `.github/workflows/api.yml`
- `.github/workflows/frontend.yml`
- `services/api/requirements.txt`
- Dockerfile / docker-compose / frontend / backend файлы

## Самый простой способ

1. Распакуй этот архив.
2. Скопируй содержимое папки `legal-sandbox` в свою локальную папку репозитория с заменой файлов.
3. В терминале в папке репозитория выполни:

```bash
git status
git add .
git commit -m "resolve PR conflicts and fix CI"
git push
```

Если работаешь именно с PR #1, перед копированием переключись на ветку этого PR:

```bash
git fetch origin
git checkout my-feature
```

После push GitHub пересчитает Pull Request. Если всё ещё пишет `This branch has conflicts`, нажми `Resolve conflicts` и проверь, что в файлах нет строк `< < < < < < <`, `= = = = = = =`, `> > > > > > >`.

## Что проверено

Backend-зависимости ставятся из `services/api/requirements.txt`.
Backend-тесты проходят командой:

```bash
cd services/api
python -m pytest -q
```

Результат проверки: `9 passed`.
