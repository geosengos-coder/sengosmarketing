/**
 * The dashboard navigation structure. Routes are declared here (single source);
 * the feature pages they point to are built in later phases.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "AI Employees", href: "/employees" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Integrations", href: "/integrations" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];
