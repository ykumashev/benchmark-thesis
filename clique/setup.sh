#!/bin/bash

rm -rf node1 node2 node3 node4 enode_id genesis.json addresses

openssl rand -hex 32 | tr -d "\n" > "jwt.hex"

# start a bootnode
enode="enode://"
enode+=76a8171707eca17647a47ca99ffd348927dfa60102792ea349a25d5192e61855be83b786e376276a306afcceea4ffd1c9c77e4370b417efc39f328a0d068004c
enode+="@172.25.0.101:30301"

echo $enode > bootnode_enode
echo $enode

# Define the number of nodes
NUM_NODES=3
PASSWORD="password"
GENESIS_FILE="genesis.json"
declare -A ADDRESS_MAP  # Declare an associative array for ADDRESSES mapping

# Create a directory for each node and generate an Ethereum account
declare -a SIGNERS=()
for i in $(seq 1 $NUM_NODES); do
    NODE_DIR="node$i"
    mkdir -p $NODE_DIR
    echo $PASSWORD > $NODE_DIR/password.txt
    ACCOUNT=$(geth --datadir $NODE_DIR account new --password $NODE_DIR/password.txt | grep -o '0x[0-9a-fA-F]\+')
    SIGNERS+=($ACCOUNT)
    ADDRESS_MAP["850$i"]=$ACCOUNT 
done

# create ADDRESSES file
echo "Writing ADDRESSES mapping to file 'ADDRESSES'..."
JSON="{"
for key in "${!ADDRESS_MAP[@]}"; do
    JSON+="\"$key\": \"${ADDRESS_MAP[$key]}\", "
done
JSON="${JSON%, }"  # Remove trailing comma and space
JSON+="}"

echo "$JSON" > loadtests/addresses

# take note of all created ADDRESSES
for SIGNER in "${SIGNERS[@]}"; do
    ACCOUNT_MAP+="\"${SIGNER:2}\" : \"${SIGNER:2}\" ,"
    EXTRADATA+="${SIGNER:2}"
done

# Prepare alloc and extradata sections for genesis file
ALLOC_SECTION="{"
EXTRADATA="0x0000000000000000000000000000000000000000000000000000000000000000"
for SIGNER in "${SIGNERS[@]}"; do
    ALLOC_SECTION+="\"${SIGNER:2}\": { \"balance\": \"1000000000000000000000000\" },"
    EXTRADATA+="${SIGNER:2}"
done
ALLOC_SECTION=${ALLOC_SECTION%,} # Remove trailing comma
ALLOC_SECTION+="}"
EXTRADATA+="0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

# Create the genesis file for Clique
cat << EOF > $GENESIS_FILE
{
  "config": {
    "chainId": 1234,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "clique": {
      "period": 5,
      "epoch": 30000
    }
  },
  "alloc": $ALLOC_SECTION,
  "difficulty": "1",
  "extraData": "$EXTRADATA",
  "gasLimit": "800000000"
}
EOF

echo "Clique genesis file created with pre-allocated balances: $GENESIS_FILE"

# Start Docker Compose
docker-compose up --build