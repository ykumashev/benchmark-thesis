SHELL := /bin/bash

# Build linux binary on other platforms
start-benchamrking-tool:
	node server.js
	cd frontend/my-app & npm start
.PHONY: start-benchamrking-tool
