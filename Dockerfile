FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./


FROM base AS development

RUN npm ci

USER node

EXPOSE 3000

CMD ["npm", "run", "start:dev"]


FROM base AS build

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm run prisma:generate --if-present

COPY src ./src
COPY test ./test
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

RUN npm run build
RUN npm prune --omit=dev


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]