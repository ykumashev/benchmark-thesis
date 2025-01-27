# Network configuration
.PHONY: help localnet-start-4 localnet-start-8 localnet-start-16 localnet-start-32 localnet-stop clean

# Default number of nodes
NETWORK_SIZE ?= 4

help:
	@echo "Available commands:"
	@echo "make localnet-start-4  - Start local network with 4 nodes"
	@echo "make localnet-start-8  - Start local network with 8 nodes"
	@echo "make localnet-start-16 - Start local network with 16 nodes"
	@echo "make localnet-start-32 - Start local network with 32 nodes"
	@echo "make localnet-stop     - Stop the local network"
	@echo "make clean            - Remove all container data"

# Base command for starting the network
define start_network
	@echo "Starting local network with $(1) nodes..."
	@NETWORK_SIZE=$(1) docker compose up -d geth-bootnode $(shell seq -f "node%g" 1 $(1) | tr '\n' ' ')
endef

# Commands for different network sizes
localnet-start-4:
	$(call start_network,4)

localnet-start-8:
	$(call start_network,8)

localnet-start-16:
	$(call start_network,16)

localnet-start-32:
	$(call start_network,32)

# Stop the network
localnet-stop:
	@echo "Stopping local network..."
	@docker compose down
#   Remove all stopped containers and unused volumes
	docker volume ls -q | grep clique | xargs -r docker volume rm
	@echo "Network stopped"