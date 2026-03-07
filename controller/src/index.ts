import { Elysia } from "elysia";
import { prisma } from "./lib/prisma";
import staticPlugin from "@elysiajs/static";



const app = new Elysia()
  .use(staticPlugin({
    prefix: "/",
  }))
  .get("/", () => "Hello Elysia")
  .get("/users", () => prisma.user.findMany())
  .listen(3000);



console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app 