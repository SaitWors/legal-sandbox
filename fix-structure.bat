@echo off
echo Исправление структуры проекта...

cd /d C:\dev\contract-workspace\apps\frontend

:: 1. Переименуем файлы
if exist "src\app\layout.tssx" (
  ren "src\app\layout.tssx" "layout.tsx"
  echo layout.tssx -> layout.tsx
)

if exist "src\app\page.tssx" (
  ren "src\app\page.tssx" "page.tsx"
  echo page.tssx -> page.tsx
)

:: 2. Создаем папку legal если её нет
if not exist "src\app\legal" mkdir "src\app\legal"

:: 3. Перемещаем файлы песочницы в правильное место
if exist "src\legal" (
  echo Папка src\legal существует, проверьте её содержимое
)

echo.
echo Структура исправлена!
echo Теперь проверьте содержимое файлов.
pause