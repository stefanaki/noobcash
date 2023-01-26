# Docker Setup

You can simulate the system on a single machine by running multiple Docker containers that operate in the same internal network.

1. Build the Docker image for the Noobcash backend

    ```sh
    sudo docker build -t nb-backend .
    ```

2. Create a bridge network for all the nodes

    ```sh
    sudo docker network create --subnet=192.168.0.0/24 nb-net
    ```

3. Edit node-specific environment variables

    ```sh
    NODE_INDEX=1 \
    NUM_NODES=5 \
    IP=192.168.0.1${NODE_INDEX}
    URL=http://${IP} \
    PORT=300${NODE_INDEX} \
    IS_BOOTSTRAP=false \
    BOOTSTRAP_URL=http://192.168.0.10 \
    BOOTSTRAP_PORT=3000 \
    DIFFICULTY=4 \
    BLOCK_CAPACITY=5 \
    PASSPHRASE=asdf
    ```

4. Run the container
    ```sh
    sudo docker run -it \
    --net nb-net \
    --ip ${IP} \
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
    -v `pwd`:/app \
    -v `pwd`/node_modules:/app/node_modules \
    nb-backend
    ```
    Auto-reload works great for testing too!
