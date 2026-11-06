FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY frontend/package.json frontend/yarn.lock ./frontend/

RUN apt-get update && apt-get install -y \
	build-essential \
	git \
	ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

RUN yarn cache clean \
	&& yarn install --frozen-lockfile --network-concurrency 1 \
	&& yarn --cwd frontend install --frozen-lockfile

COPY . .
RUN yarn build \
	&& rm -rf node_modules/ frontend/node_modules/ \
	&& yarn install --production --frozen-lockfile


FROM gcr.io/distroless/nodejs24-debian12 AS production
WORKDIR /home/node/app
USER nonroot

COPY --from=builder /app/package.json .
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 8097

CMD ["./dist/src/server.js"]
