# use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

# stage 1: install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY server/package.json /temp/dev/server/
RUN cd /temp/dev && bun install --frozen-lockfile

# stage 2: build & generate
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=install /temp/dev/server/node_modules server/node_modules
COPY . .

# optional: pass the API URL at build time for the frontend
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# build the frontend
RUN bun run build

# generate prisma client
WORKDIR /usr/src/app/server
# Provide a dummy DATABASE_URL during generation as required by prisma.config.ts
ENV DATABASE_URL=file:./dev.db
RUN bun run prisma generate

# stage 3: runtime
FROM base AS release
COPY --from=prerelease /usr/src/app .

# expose ports: backend (3000), pos (4000), frontend (5173)
EXPOSE 3000 4000 5173

# default command
CMD ["bun", "run", "dev"]
