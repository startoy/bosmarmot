FROM golang:1.10.1-alpine3.7
MAINTAINER Monax <support@monax.io>

# This is the image used by the Circle CI config in this directory pushed to quay.io/monax/bosmarmot:ci
# docker build -t quay.io/monax/bosmarmot:ci -f ./.circleci/Dockerfile .
RUN apk add --update --no-cache nodejs netcat-openbsd git make bash gcc g++ jq
RUN go get github.com/jstemmer/go-junit-report
RUN go get -u github.com/golang/dep/cmd/dep
RUN npm install -g mocha
RUN npm install -g standard
RUN npm install -g mocha-circleci-reporter