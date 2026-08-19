import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Acceso al panel",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-[#d4d4d8] bg-white p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#71717a]">
          AlterSTW
        </p>
        <h1 className="mt-2 text-xl font-bold text-[#18181b]">
          Acceso al panel
        </h1>
        <p className="mt-1 text-sm text-[#52525b]">
          Entra con tu cuenta de administración.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-[#52525b] hover:text-[#18181b]"
      >
        ← Volver a la tienda
      </Link>
    </div>
  );
}