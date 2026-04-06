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
>>>>>>> 945d7f9 (lab-1-3-and_Docker)
