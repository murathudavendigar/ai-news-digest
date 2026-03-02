/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Haber resimleri yüzlerce farklı CDN/domain'den geliyor.
    // Wildcard ** tüm HTTPS kaynaklarına izin verir.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
