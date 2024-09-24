FROM node:slim

WORKDIR /index
COPY . .
RUN npm ci

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["npm", "run", "start"]
