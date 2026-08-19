"use client";

export default function StorefrontError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="tilework-on-paper mx-auto flex max-w-md flex-col items-center gap-4 rounded-print border border-rule bg-paper px-6 py-16 text-center">
      <p className="font-display text-2xl font-extrabold uppercase tracking-tight">
        Papel <span className="text-red">atascado</span>
      </p>
      <p className="text-sm leading-relaxed text-ink/80">
        Algo ha fallado al cargar el catálogo. Comprueba que las claves de
        Supabase están en <code>.env.local</code> y vuelve a intentarlo.
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Reintentar
      </button>
    </div>
  );
}