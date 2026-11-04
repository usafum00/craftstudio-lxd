/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3", "adm-zip"],
  images: {
    unoptimized: true,
  },
  // Allow all tunnel and cloud domains (e.g. *.onrender.com, *.trycloudflare.com, *.up.railway.app, localhost)
  experimental: {
    middlewareClientMaxBodySize: '1000mb',
    serverActions: {
      allowedOrigins: ["*"],
      bodySizeLimit: '1000mb',
    },
  },
  // Allowed development origins for WebSocket HMR & tunnel proxying
  allowedDevOrigins: [
    "localhost:3000",
    "localhost:3001",
    "127.0.0.1:3000",
    "127.0.0.1:3001",
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok.io",
    "*.ngrok-free.app",
    "*.up.railway.app",
    "*.onrender.com",
  ],
};

export default nextConfig;
