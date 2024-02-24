FROM node:20-alpine

WORKDIR /app

COPY package*.json .

COPY config.env .

RUN npm install

COPY . .

EXPOSE 4000

CMD [ "npm",  "start" ]