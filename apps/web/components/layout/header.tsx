"use client";

export function Header({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow ?? "// octroi"}
      </div>
      <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
