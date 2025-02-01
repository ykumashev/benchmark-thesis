#!/bin/bash

# Check if node number is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <node_number>"
  exit 1
fi

NODE_NUM=$1

# Directories
NODE_DIR="nodes/dd${NODE_NUM}"
KEY_DIR="nodes/keys"
RAFT_DIR="nodes/raft"

# Ensure the directories exist
mkdir -p "$NODE_DIR"
mkdir -p "$KEY_DIR"
mkdir -p "$RAFT_DIR"

# Step 1: Generate the raft node key
echo "Generating raft node key for node $NODE_NUM..."
bootnode -genkey "${RAFT_DIR}/nodekey${NODE_NUM}"

# Step 2: Create a new account for the node
echo "Creating new account for node $NODE_NUM..."
geth --datadir "${NODE_DIR}" account new --password passwords.txt

# Step 3: Copy the keystore files to the keys directory
echo "Copying keystore files to keys directory..."
cp "${NODE_DIR}/keystore/"* "${KEY_DIR}/key${NODE_NUM}"

# Step 4: Retrieve the enode address for the node
echo "Retrieving enode address for node $NODE_NUM..."
ENODE_ADDRESS=$(bootnode -nodekey "${RAFT_DIR}/nodekey${NODE_NUM}" -writeaddress)

echo "Node $NODE_NUM setup completed."
echo "Enode: $ENODE_ADDRESS"
