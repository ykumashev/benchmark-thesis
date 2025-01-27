SHELL := /bin/bash

OUTPUT?=build/tendermint

# Build linux binary on other platforms
build-linux:
	GOOS=linux GOARCH=amd64 $(MAKE) build
.PHONY: build-linux

build-docker-localnode:
	@cd networks/local && make
.PHONY: build-docker-localnode

localnet-start: localnet-stop build-linux build-docker-localnode
	@if ! [ -f build/node0/config/genesis.json ]; then \
		docker run --rm -v $(CURDIR)/build:/tendermint:Z tendermint/localnode testnet --config /etc/tendermint/config-template.toml --o . --v $(NUM_NODES) --starting-ip-address 192.167.10.2; \
	fi

	# Create the list of nodes to start based on NUM_NODES
	@nodes=""
	@for i in `seq 0 $$(($(NUM_NODES)-1))`; do \
		nodes="$${nodes}node$$i "; \
	done; \
	echo "Starting nodes: $${nodes}"; \
	docker compose up $${nodes} -d
.PHONY: localnet-start

localnet-stop:
	docker compose down
#   rm -rf ./build/node*    MANUAL STEP, needs to be executed with sudo
	docker system prune --volumes -f
.PHONY: localnet-stop