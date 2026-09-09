/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist", "pdf-lib"],
  },
  async redirects() {
    // The marketing site is now one page — old routes jump to the section.
    return [
      { source: "/how-it-works", destination: "/#how-it-works", permanent: false },
      { source: "/features", destination: "/#features", permanent: false },
      { source: "/for-officers", destination: "/#for-officers", permanent: false },
      { source: "/for-vendors", destination: "/#for-vendors", permanent: false },
      { source: "/about", destination: "/#about", permanent: false },
    ];
  },
};

export default nextConfig;
