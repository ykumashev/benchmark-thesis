#!/bin/sh
# Define the data directory, genesis file, and bootnode enode paths inside the container
DATADIR="/root/.ethereum"
GENESIS_FILE="/root/genesis.json"
BOOTNODE_ENODE_FILE="/root/bootnode_enode"

# Copy the genesis file and bootnode enode URL into the container
cp genesis.json $GENESIS_FILE
cp bootnode_enode $BOOTNODE_ENODE_FILE

# Read the bootnode enode URL
BOOTNODE_ENODE=$(cat $BOOTNODE_ENODE_FILE)

# Initialize the blockchain with the genesis file inside the container
echo "Initializing blockchain with genesis file..."
geth init --datadir $DATADIR $GENESIS_FILE

# Wait for bootnode to be ready
sleep 3

# Extract the account address from the keystore file
ACCOUNT_ADDRESS=$(ls $DATADIR/keystore | sed 's/.*--//' | sed 's/.json//' | head -n 1)

# Print the command before execution
echo "Starting geth node with the following command:"
echo "geth --datadir $DATADIR \\"
echo "    --networkid 1234 \\"
echo "    --http --http.port 8545 --http.addr=0.0.0.0 --http.vhosts='*' --http.api='eth,net,web3,personal' \\"
echo "    --port 30303 --bootnodes $BOOTNODE_ENODE \\"
echo "    --mine --miner.etherbase $ACCOUNT_ADDRESS \\"
echo "    --unlock $ACCOUNT_ADDRESS --password /root/.ethereum/password.txt \\"
echo "    --allow-insecure-unlock --verbosity 3"

# Start the geth node
exec geth --datadir $DATADIR \
    --networkid 1234 \
    --http --http.port 8545 --http.addr=0.0.0.0 --http.vhosts="*" --http.api="eth,net,web3,personal,clique" \
    --port 30303 \
    --bootnodes $BOOTNODE_ENODE \
    --mine --miner.etherbase $ACCOUNT_ADDRESS \
    --unlock $ACCOUNT_ADDRESS --password /root/.ethereum/password.txt \
    --allow-insecure-unlock \
    --verbosity 3

