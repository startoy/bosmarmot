# BUILD IMAGE
FROM golang:1.10-alpine3.7 as builder
MAINTAINER Monax <ops@monax.io>

RUN apk --update --no-cache add \
	bash \
	curl \
	gcc \
	git \
    make \
    openssh-client \
	musl-dev \
	tar

ENV REPO github.com/monax/bosmarmot
ENV INSTALL_BASE /usr/local/bin

ENV HELM_VERSION 2.8.2
ENV KUBECTL_VERSION 1.9.4

# via: https://kubernetes.io/docs/tasks/tools/install-kubectl/
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
  chmod +x ./kubectl && \
  mv ./kubectl $INSTALL_BASE/kubectl

# via: https://docs.helm.sh/using_helm/#installing-helm
RUN curl -LO https://storage.googleapis.com/kubernetes-helm/helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
  tar -xzf helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
  mv linux-amd64/helm $INSTALL_BASE/helm

COPY . $GOPATH/src/$REPO
WORKDIR $GOPATH/src/$REPO

RUN make build \
  bin/burrow && \
  cp bin/* $INSTALL_BASE/

FROM quay.io/monax/solc:contract-name-not-path as solc-builder

# PRODUCTION IMAGE
FROM alpine:3.7
MAINTAINER Monax <ops@monax.io>

RUN apk --update --no-cache add \
  bash \
  coreutils \
  curl \
  git \
  g++ \
  jq \
  libc6-compat \
  make \
  nodejs \
  nodejs-npm \
  openssh-client \
  python \
  py-crcmod \
  tar

ENV CLOUD_SDK_VERSION 193.0.0
ENV INSTALL_BASE /usr/local/bin
ENV PATH "$PATH:/var/google-cloud-sdk/bin"

# via: https://github.com/GoogleCloudPlatform/cloud-sdk-docker/blob/master/alpine/Dockerfile
RUN curl -LO https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz && \
  tar -xzf google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz && \
  mv google-cloud-sdk /var && \
  rm google-cloud-sdk-${CLOUD_SDK_VERSION}-linux-x86_64.tar.gz && \
  ln -s /var/google-cloud-sdk/lib /var/google-cloud-sdk/lib64 && \
  /var/google-cloud-sdk/bin/gcloud config set core/disable_usage_reporting true && \
  /var/google-cloud-sdk/bin/gcloud config set component_manager/disable_update_check true


COPY --from=builder $INSTALL_BASE/* $INSTALL_BASE/
COPY --from=solc-builder /usr/bin/solc $INSTALL_BASE/
