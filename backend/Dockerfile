FROM node:14.21-alpine3.16

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY . .

VOLUME ["/app/node_modules"]

CMD ["npm", "run", "dev"]
