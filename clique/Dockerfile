FROM ubuntu:xenial

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root

# Download and install Geth v1.13.14
RUN wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.14-2bd6bd01.tar.gz \
    && tar -xvzf geth-linux-amd64-1.13.14-2bd6bd01.tar.gz \
    && mv geth-linux-amd64-1.13.14-2bd6bd01/geth /usr/local/bin/ \
    && rm -rf geth-linux-amd64-1.13.14-2bd6bd01 geth-linux-amd64-1.13.14-2bd6bd01.tar.gz

# Copy genesis file and password file to the container
COPY genesis.json .
COPY init_node.sh .
COPY bootnode_enode .
COPY jwt.hex .

# Make the script executable
RUN chmod +x init_node.sh

EXPOSE 8545
EXPOSE 30303

# Set the entrypoint to run the initialization script
ENTRYPOINT ["./init_node.sh"]