FROM node:16

RUN mkdir -p /app
WORKDIR /app

ADD package.json /app
RUN npm install

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ADD . /app
RUN npm run build

ENTRYPOINT [ "./scripts/entry.sh" ]

EXPOSE 3003