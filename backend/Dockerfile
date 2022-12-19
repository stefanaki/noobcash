FROM node:14.21-alpine3.16

WORKDIR /app

COPY package.json .

RUN npm install --silent

COPY . .

VOLUME ["/app/node_modules"]

CMD ["npm", "run", "dev"]
