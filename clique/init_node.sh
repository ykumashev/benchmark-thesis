#!/bin/sh
# Define the data directory and genesis file
DATADIR="/root/.ethereum"
GENESIS_FILE="/root/genesis.json"
BOOTNODE_ENODE=$(cat "/root/bootnode_enode")

# Initialize the blockchain if not already initialized
if [ ! -d "$DATADIR/geth" ]; then
    echo "Initializing blockchain with genesis file..."
    geth init --datadir $DATADIR $GENESIS_FILE
fi

# Wait for bootnode to be ready
sleep 5

ACCOUNT_FILE=$(ls $DATADIR/keystore | head -n 1)  # Get the first file in keystore directory
ACCOUNT_ADDRESS=$(echo $ACCOUNT_FILE | sed 's/.*--//' | sed 's/.json//')

# Print the command before executing
echo "Executing geth with the following command:"
echo "exec geth --datadir $DATADIR \\"
echo "    --networkid 1234 \\"
echo "    --authrpc.port 8550 \\"
echo "    --port 30303 \\"
echo "    --bootnodes $BOOTNODE_ENODE \\"
echo "    --mine --miner.etherbase $ACCOUNT_ADDRESS \\"
echo "    --unlock $ACCOUNT_ADDRESS --password /root/.ethereum/password.txt \\"
echo "    --verbosity 3"

# Start the geth node
echo "Starting geth node..."
exec geth --datadir $DATADIR \
    --networkid 1234 \
    --http --http.port 8545 --http.addr=0.0.0.0 --http.vhosts="*" --http.api="eth,net,web3,personal" \
    --http.corsdomain "*" \
    --port 30303 \
    --bootnodes $BOOTNODE_ENODE \
    --mine --miner.etherbase $ACCOUNT_ADDRESS \
    --unlock $ACCOUNT_ADDRESS --password /root/.ethereum/password.txt \
    --allow-insecure-unlock \
    --verbosity 3
    # --rpcapi 'db,eth,net,web3,personal' \
    # --rpc --rpc.api 'eth,net,web3,personal'