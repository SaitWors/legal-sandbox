"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LegalSandbox from "@/components/legal/LegalSandbox";

export default function LegalSandboxPage() {
  return (
    <ProtectedRoute>
      <LegalSandbox />
    </ProtectedRoute>
  );
}
