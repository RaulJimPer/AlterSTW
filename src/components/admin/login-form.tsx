"use client";

import { useState, useTransition } from "react";
import { loginWithPassword } from "@/lib/auth/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await loginWithPassword({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-[#18181b]">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="admin-field"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-[#18181b]">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="admin-field"
        />
      </label>
      {error !== null && (
        <p role="alert" className="text-sm text-[#dc2626]">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="admin-btn-primary">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}