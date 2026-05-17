export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">404</div>
      <h1 className="mt-4 text-4xl font-semibold text-slate-950">Страница не найдена</h1>
      <p className="mt-4 text-base leading-8 text-slate-600">Похоже, маршрут отсутствует или был перемещён. Вернись на главную и продолжи работу.</p>
    </div>
  );
}
