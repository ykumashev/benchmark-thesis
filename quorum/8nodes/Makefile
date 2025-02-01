SHELL := /bin/bash

OUTPUT?=build/quorum

# Start the network with 8 nodes
localnet-start: localnet-stop
	echo "Starting the network with 8 nodes"
	docker compose up -d
.PHONY: localnet-start

localnet-stop:
	docker compose down
# Remove all stopped containers and unused volumes
	docker volume ls -q | grep 8nodes | xargs -r docker volume rm
.PHONY: localnet-stop
