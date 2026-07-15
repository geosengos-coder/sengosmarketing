/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are shipped as TS source and transpiled by Next.
  transpilePackages: [
    "@operatoros/ai",
    "@operatoros/brain",
    "@operatoros/core",
    "@operatoros/database",
    "@operatoros/dna",
    "@operatoros/services",
    "@operatoros/contracts",
    "@operatoros/ui",
    "@operatoros/voice",
  ],
};

export default nextConfig;
