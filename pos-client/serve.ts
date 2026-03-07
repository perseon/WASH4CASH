// pos-client/serve.ts
import { serve } from "bun";
import { join } from "path";

const PORT = 4000;

serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        let path = url.pathname;

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
});

console.log(`🚀 POS Interface running at http://localhost:${PORT}`);
