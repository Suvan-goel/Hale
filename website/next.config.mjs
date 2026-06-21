import { fileURLToPath } from 'node:url';

const websiteRoot = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  turbopack: {
    root: websiteRoot,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
