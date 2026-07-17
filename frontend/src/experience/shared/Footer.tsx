const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Industries", href: "#industries" },
  { label: "Pricing", href: "#pricing" },
  { label: "Talk to Ava", href: "#dna-experience" },
];

export function Footer() {
  return (
    <footer className="w-full bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
        <span className="font-semibold tracking-tight text-foreground">OperatorOS</span>
        <nav className="flex items-center gap-6">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <span>© {new Date().getFullYear()} OperatorOS</span>
      </div>
    </footer>
  );
}
