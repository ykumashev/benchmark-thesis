#!/bin/bash

# File to store the stats
OUTPUT_FILE="docker_stats_log.txt"

# Clear the previous file if exists
> $OUTPUT_FILE

# Run the loop every 1 second
while true; do
    # Capture stats for all containers and append to the file
    echo "Timestamp: $(date)" >> $OUTPUT_FILE
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    sleep 1
done
