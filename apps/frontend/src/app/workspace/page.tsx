import type { Metadata } from "next";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LegalSandbox from "@/components/legal/LegalSandbox";

export const metadata: Metadata = {
  title: "Рабочая область документов",
  description: "Закрытый раздел Contract Workspace для анализа документов и работы с вложениями.",
  alternates: { canonical: "/workspace" },
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <LegalSandbox />
    </ProtectedRoute>
  );
}
