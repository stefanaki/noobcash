FROM node:18.4.0-slim

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY . .

VOLUME ["/app/node_modules"]

RUN npm run build

CMD ["node", "dist/index.js"]
