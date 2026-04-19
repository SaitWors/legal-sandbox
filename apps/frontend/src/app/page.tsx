import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Проверка договоров и управление юридическими документами",
  description: "Contract Workspace помогает искать конфликты в договорах, хранить документы по ролям и безопасно работать с файлами.",
  alternates: { canonical: "/" },
};

const features = [
  {
    title: "Анализ документов",
    text: "Сегментация текста, поиск дублей и конфликтов, быстрый переход к спорным пунктам.",
  },
  {
    title: "Ролевой доступ",
    text: "Пользователь, менеджер и администратор работают по своим полномочиям без лишних привилегий.",
  },
  {
    title: "Файлы и объектное хранилище",
    text: "Вложения к документам, защищённые ссылки на скачивание и S3-compatible режим через MinIO.",
  },
  {
    title: "Публичная витрина и интеграции",
    text: "Индексируемые страницы, sitemap/robots и отдельный слой интеграции со сторонним API подсказок терминов.",
  },
];

const stats = [
  { label: "Ролевой контроль", value: "RBAC" },
  { label: "Сессии", value: "Access + Refresh" },
  { label: "Хранилище", value: "Local / S3" },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Contract Workspace",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Рабочее пространство для анализа договоров и управления юридическими документами.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.4fr_1fr] lg:p-12">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Production-ready workspace
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Contract Workspace — безопасное приложение для проверки договоров и работы с документами
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Платформа объединяет анализ текста, документооборот, разграничение доступа, восстановление сессии,
            загрузку вложений и публичные продуктовые страницы в единой Docker-готовой структуре.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workspace" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
              Открыть рабочую область
            </Link>
            <Link href="/legal" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Посмотреть публичную страницу
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] bg-slate-950 p-6 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ключевые возможности</p>
            <p className="mt-2 text-2xl font-semibold">Контроль документов без лишнего шума</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-lg font-semibold text-white">{item.value}</div>
                <div className="mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
