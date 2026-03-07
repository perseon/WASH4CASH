import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors'
import { prisma } from "./lib/prisma";



const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia")
  .get("/users", () => prisma.user.findMany())
  .ws('/ws', {
    open(ws) {
      console.log('🚀 WebSocket connection opened')
      prisma.user.findMany().then(users => {
        ws.send({ type: 'users', data: users })
      })
    },
    message(ws, message) {
      console.log('📩 [Backend] WebSocket message received:', message)
      if (message === 'refresh') {
        prisma.user.findMany().then(users => {
          ws.send({ type: 'users', data: users })
        })
      }
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app