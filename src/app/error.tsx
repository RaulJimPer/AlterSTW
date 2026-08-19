"use client";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <p className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink">
        Papel <span className="text-red">atascado</span>
      </p>
      <p className="max-w-md text-sm text-ink/80">
        Se ha producido un error inesperado. Si persiste, revisa la configuración
        de la tienda.
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Reintentar
      </button>
    </div>
  );
}