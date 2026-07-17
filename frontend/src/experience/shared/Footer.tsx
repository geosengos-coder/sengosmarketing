import { SdsLogo } from "./SdsLogo";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Industries", href: "#industries" },
  { label: "Pricing", href: "#pricing" },
  { label: "Talk to Ava", href: "#dna-experience" },
];

export function Footer() {
  return (
    <footer className="w-full bg-stage px-6 py-10 text-background sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-background/55 sm:flex-row">
        <SdsLogo showFullName size={26} className="text-background" />
        <nav className="flex items-center gap-6">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-background">
              {l.label}
            </a>
          ))}
        </nav>
        <span>© {new Date().getFullYear()} Sengos Digital Systems</span>
      </div>
    </footer>
  );
}
