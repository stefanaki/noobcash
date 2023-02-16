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

3. In the `node.sh` file, edit node-specific environment variables

    ```sh
    NODE_INDEX=1 \
    NUM_NODES=5 \
    IP=192.168.0.1${NODE_INDEX} \
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
    sudo ./node.sh
    ```
    Auto-reload works great for testing too!
