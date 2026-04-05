<<<<<<< HEAD
"use client";

import LegalSandbox from "@/components/legal/LegalSandbox";

export default function LegalPage() {
  return <LegalSandbox />;
}
=======
import { redirect } from "next/navigation";

export default function LegalPage() {
  redirect("/legal/sandbox");
}
>>>>>>> 73dd6ff (С 1й по 3ю и docker)
