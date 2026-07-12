/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are shipped as TS source and transpiled by Next.
  transpilePackages: [
    "@operatoros/core",
    "@operatoros/database",
    "@operatoros/services",
    "@operatoros/contracts",
    "@operatoros/ui",
  ],
};

export default nextConfig;
