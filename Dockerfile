# Use Ubuntu latest as the base image
# Use a specific SHA256 digest for reproducibility
# https://hub.docker.com/layers/ubuntu/latest/images/sha256-1e622c5f073b4f6bfad6632f2616c7f59ef256e96fe78bf6a595d1dc4376ac02?context=explore
FROM ubuntu:latest@sha256:1e622c5f073b4f6bfad6632f2616c7f59ef256e96fe78bf6a595d1dc4376ac02

RUN apt-get update && \
    apt-get install -y curl gnupg2 lsb-release build-essential g++ gcc git software-properties-common apt-transport-https ca-certificates nodejs npm mariadb-server-core mariadb-client-core mariadb-common && \
    apt-get upgrade && \
    service mariadb start
# Add the NodeSource APT repository for Node.js
RUN curl -sL https://deb.nodesource.com/setup_23.x | bash -
# Clean unnecessary files
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set the working directory in the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install app dependencies
RUN npm install --production
# Copy the rest of the application code
COPY . .
# Expose the port the app runs on
EXPOSE 8080
EXPOSE 3306
# Use a non-root user to run the application
RUN useradd -m appuser
USER appuser
# Set the environment variable for the application
ENV NODE_ENV=production