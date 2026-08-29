import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// Set NGROK=1 when tunnelling (`NGROK=1 npm run dev`) so HMR reconnects over
// ngrok's TLS endpoint. Left off, HMR works normally on localhost.
const viaNgrok = process.env.NGROK === "1";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces so ngrok (and phones on the LAN) can reach it.
    host: true,
    // Free-tier ngrok subdomains change on every restart, so allow the whole
    // domain rather than pinning one host.
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io", ".ngrok.app"],
    ...(viaNgrok && { hmr: { clientPort: 443, protocol: "wss" } }),
    // Proxy the API through the dev server so a tunnelled visitor reaches the
    // backend too — "localhost:5001" would otherwise resolve to *their* machine.
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.BACKEND_PORT || 5001}`,
        changeOrigin: true,
      },
    },
  },
});
