FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/server/ ./packages/server/

RUN pnpm install --frozen-lockfile

WORKDIR /app/packages/server

EXPOSE 4000

CMD ["npx", "tsx", "src/index.ts"]
