import type { Metadata } from "next";

import TermInsightsClient from "@/components/legal/TermInsightsClient";

export const metadata: Metadata = {
  title: "Публичная страница продукта",
  description: "Индексируемая страница Contract Workspace с canonical, Open Graph, JSON-LD и блоком интеграций.",
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Contract Workspace — проверка договоров и контроль документов",
    description: "Публичная страница продукта с SEO-разметкой и интеграцией подсказок юридических терминов.",
    url: "http://localhost/legal",
  },
};

export default function LegalPublicPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Платформа для проверки договоров и управления документами</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Эта страница индексируется поисковыми системами и описывает продукт простым языком:
            как контролируются документы, как разграничиваются роли и как подключаются внешние сервисы
            без вывода закрытой пользовательской части в публичный доступ.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Что доступно публично</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">Главная страница и продуктовый раздел с описанием сценариев, преимуществ и архитектурных принципов.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Что закрыто</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">Рабочая область, управление ролями, формы входа и внутренние маршруты с пользовательскими данными.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
          <h2 className="text-xl font-semibold">Техническая основа</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <li>• `robots.txt` и `sitemap.xml` генерируются в приложении.</li>
            <li>• canonical URL настроены через metadata API Next.js.</li>
            <li>• `JSON-LD` описывает продукт как `SoftwareApplication`.</li>
            <li>• данные из внешнего API проходят через backend-слой с таймаутами и защитой от отказов.</li>
          </ul>
        </aside>
      </section>

      <section className="mt-10">
        <TermInsightsClient />
      </section>
    </div>
  );
}
