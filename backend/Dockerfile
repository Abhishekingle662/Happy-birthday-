FROM oven/bun:latest as base
WORKDIR /usr/src/app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

EXPOSE 3001
CMD ["bun", "run", "index.ts"]