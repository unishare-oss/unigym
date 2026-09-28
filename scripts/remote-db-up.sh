#!/bin/sh
set -eu

ssh oracle 'mkdir -p /home/ubuntu/unigym'
scp compose.yaml oracle:/home/ubuntu/unigym/compose.yaml
ssh oracle 'cd /home/ubuntu/unigym && sudo docker compose up -d db'
