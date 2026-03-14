// pos-client/serve.ts
import { serve } from "bun";
import { join } from "path";

const PORT = 4000;

serve({
    port: PORT,
    hostname: "0.0.0.0",
    async fetch(req, server) {
        const url = new URL(req.url);
        let path = url.pathname;

        // Correctly handle WebSocket upgrade to proxy to backend
        if (path === "/ws") {
            const success = server.upgrade(req);
            if (success) return undefined;
            return new Response("Upgrade failed", { status: 400 });
        }

        if (path === "/") path = "/index.html";

        try {
            const file = Bun.file(join(import.meta.dir, path));
            const exists = await file.exists();

            if (exists) {
                return new Response(file);
            }

            return new Response("Not Found", { status: 404 });
        } catch (e) {
            return new Response("Internal Server Error", { status: 500 });
        }
    },
    websocket: {
        open(ws) {
            console.log("🔗 [POS-Proxy] WebSocket opened, connecting to backend...");
            const backendWs = new WebSocket("ws://backend:3000/ws");
            
            // @ts-ignore
            ws.data = { backendWs };
            
            backendWs.onopen = () => {
                console.log("🔗 [POS-Proxy] Connected to backend WS");
            };

            backendWs.onmessage = (event) => {
                ws.send(event.data);
            };

            backendWs.onclose = () => {
                console.log("❌ [POS-Proxy] Backend WS closed");
                ws.close();
            };

            backendWs.onerror = (err) => {
                console.error("⚠️ [POS-Proxy] Backend WS error:", err);
                ws.close();
            };
        },
        message(ws, message) {
            // @ts-ignore
            const backendWs = ws.data.backendWs;
            if (backendWs.readyState === WebSocket.OPEN) {
                backendWs.send(message);
            }
        },
        close(ws) {
            // @ts-ignore
            ws.data.backendWs.close();
        }
    }
});

console.log(`🚀 POS Interface running at http://localhost:${PORT}`);
