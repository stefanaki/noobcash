#!/bin/bash

INDEX=${NODE_INDEX}
URL=${URL}
PORT=${PORT}

num_nodes=5
while getopts "n:" opt; do
    case $opt in
        n)
            num_nodes=$OPTARG
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

if [ $num_nodes -eq 5 ]; then
  directory=5nodes
elif [ $num_nodes -eq 10 ]; then
  directory=10nodes
else
  echo "Invalid number of nodes: $num_nodes" >&2
  exit 1
fi

while read -r line; do
    # Remove "id" prefix
    line=$(echo $line | sed 's/id//g')

    arr=($line)
    recipientId=${arr[0]}
    amount=${arr[1]}
    json=$(jq -n --arg recipientId "$recipientId" --argjson amount "$amount" '{recipientId: $recipientId, amount: $amount}')

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H 'Content-Type: application/json' -d "$json" ${URL}:${PORT}/transaction)

    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

	message=$(echo $response_body | jq -r '.message')
	if [[ ! $http_status =~ 2..  ]]; then
		>&2 echo $message
	fi

	echo $message
done < ./${directory}/transactions${NODE_INDEX}.txt
