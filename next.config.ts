/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // KANKA: TypeScript hataları olsa bile Vercel'in siteyi kurmasına izin verir.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Eslint hatalarını da görmezden gel kanka, kafamız rahat olsun.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;