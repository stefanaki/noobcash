# Noobcash

_A proof-of-concept Blockchain system for creating and managing a decentralized cryptocurrency._

## Backend

The Noobcash backend emulates the techniques used in many transaction-based blockchain systems, such as decentralization, hash encryption, mining, and consensus achieved through Proof-of-Work. The nodes on which the backend is deployed serve as both clients and miners.

To launch a node:

1. Set the environment variables

   ```sh
   # .env
   export NODE_INDEX=1
   export NUM_NODES=5
   export IP=192.168.0.11
   export URL=http://${IP}
   export PORT=300${NODE_INDEX}
   export IS_BOOTSTRAP=false
   export BOOTSTRAP_URL=http://192.168.0.10
   export BOOTSTRAP_PORT=3000
   export DIFFICULTY=4
   export BLOCK_CAPACITY=5
   export PASSPHRASE=node-pass-1
   ```

   Where `IP` is the IP address of the machine.

2. Load the `.env` file

   ```sh
   source .env
   ```

3. Build the backend Docker image and run the container
   ```sh
   cd backend && sudo docker build -t nb-backend .
   ```
   ```sh
   sudo docker run -it \
   -p ${PORT}:${PORT} \
   -e NODE_INDEX=${NODE_INDEX} \
   -e NUM_NODES=${NUM_NODES} \
   -e IS_BOOTSTRAP=${IS_BOOTSTRAP} \
   -e BOOTSTRAP_URL=${BOOTSTRAP_URL} \
   -e BOOTSTRAP_PORT=${BOOTSTRAP_PORT} \
   -e DIFFICULTY=${DIFFICULTY} \
   -e BLOCK_CAPACITY=${BLOCK_CAPACITY} \
   -e PASSPHRASE=${PASSPHRASE} \
   -e URL=${URL} \
   -e PORT=${PORT} \
   -v /home/user/noobcash/backend:/app \
   nb-backend
   ```

## CLI

## Web-App
