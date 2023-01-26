#!/bin/bash

INDEX=$1
URL=$2
PORT=$3
NUM_NODES=$4

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
done < ./${NUM_NODES}nodes/transactions${INDEX}.txt
