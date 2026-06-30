FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production

COPY app/package*.json ./
RUN npm install --omit=dev

COPY app ./

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "src/server.js"]
