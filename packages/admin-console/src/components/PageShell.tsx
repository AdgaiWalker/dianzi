import type { ReactNode } from "react";

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="mb-5 text-2xl font-semibold tracking-normal">{title}</h1>
      {children}
    </section>
  );
}
