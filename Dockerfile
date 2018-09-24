FROM node:10-alpine AS buildstep

RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache \
	    python \
	    make \
	    g++ \
	    git \
	    bash

COPY package.json /app
COPY package-lock.json /app

RUN npm install

FROM node:10-alpine

WORKDIR /app
VOLUME /root/.bcash/

COPY --from=buildstep /app /app
COPY . /app/
ENTRYPOINT ["./bin/bch-interlinker"]
