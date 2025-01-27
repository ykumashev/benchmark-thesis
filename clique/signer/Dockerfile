FROM ubuntu:xenial

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root

# Download and install Geth v1.13.14
RUN wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.9-dd938d10.tar.gz \
    && tar -xvzf geth-linux-amd64-1.13.9-dd938d10.tar.gz \
    && mv geth-linux-amd64-1.13.9-dd938d10/geth /usr/local/bin/ \
    && rm -rf geth-linux-amd64-1.13.9-dd938d10 geth-linux-amd64-1.13.9-dd938d10.tar.gz

# Copy all genesis files, initialization script, and other necessary files
COPY genesis.json .
COPY init_signer_node.sh .
COPY bootnode_enode .
COPY jwt.hex .

# Create .ethereum directory
RUN mkdir -p /root/.ethereum

# Make the script executable
RUN chmod +x init_signer_node.sh

EXPOSE 8545
EXPOSE 30303

# Set the entrypoint to run the initialization script
ENTRYPOINT ["./init_signer_node.sh"]