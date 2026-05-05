FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.1 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile --filter web...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
COPY packages/web/ packages/web/
WORKDIR /app/packages/web
RUN npx prisma generate
RUN npx react-router build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=deps /app/packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile --filter web... --prod
COPY --from=build /app/packages/web/build packages/web/build
COPY --from=build /app/packages/web/node_modules/@prisma/client-generated packages/web/node_modules/@prisma/client-generated
EXPOSE 3000
WORKDIR /app/packages/web
CMD ["pnpm", "react-router-serve", "./build/server/index.js"]
