# Installation

1. Build the Docker image for the Noobcash backend
    ```sh
    sudo docker build -t nb-backend .
    ```

2. Create a bridge network for all the nodes
    ```sh
    sudo docker network create --subnet=192.168.0.0/24 nb-net
    ```

3. Insert node specific environment variables
    ```sh
    NODE_INDEX=8 \
    NUM_NODES=10 \
    IP=192.168.0.1${NODE_INDEX}
    URL=http://${IP} \
    PORT=300${NODE_INDEX} \
    IS_BOOTSTRAP=false \
    BOOTSTRAP_URL=http://192.168.0.10 \
    DIFFICULTY=4 \
    BLOCK_CAPACITY=10 \
    PASSPHRASE=asdf \
    IS_PRODUCTION=true
    ```

4. Run the container
    ```sh
    sudo docker run -it \
    --net nb-net \
    --ip ${IP} \
    -p 300${NODE_INDEX}:300${NODE_INDEX} \
    -e NODE_INDEX=${NODE_INDEX} \
    -e NUM_NODES=${NUM_NODES} \
    -e IS_BOOTSTRAP=${IS_BOOTSTRAP} \
    -e BOOTSTRAP_URL=${BOOTSTRAP_URL} \
    -e DIFFICULTY=${DIFFICULTY} \
    -e BLOCK_CAPACITY=${BLOCK_CAPACITY} \
    -e PASSPHRASE=${PASSPHRASE} \
    -e IS_PRODUCTION=${IS_PRODUCTION} \
    -e URL=${URL} \
    -e PORT=${PORT} \
    -v `pwd`:/app \
    -v `pwd`/node_modules:/app/node_modules \
    nb-backend
    ```
