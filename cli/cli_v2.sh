#!/bin/bash

# Check if URL and PORT environment variables are set
if [ -z "$URL" ] || [ -z "$PORT" ]; then
    echo "URL or PORT environment variable not set. Please set them before running this script."
    exit 1
fi

# Function to display help text
function show_help {
    echo "Noobcash Client"
    echo
    echo "Commands:
    balance: show the user's current wallet balance
    transactions: show the transactions of the latest block of the chain
    transaction [recipientId] [amount]: create a new transaction
    help: show this help text"
}

# Check if the number of arguments passed is correct
if [[ "$#" -ne 1 ]] && [[ "$#" -ne 3 ]]; then
    echo "Invalid number of arguments. Run 'help' for more information."
    exit 1
fi

# Check if the recipientId and amount are valid numbers
if [[ "$#" -eq 3 ]]; then
    if ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "Invalid recipientId. It must be a number."
        exit 1
    fi

    if ! [[ "$3" =~ ^[0-9]+$ ]]; then
        echo "Invalid amount. It must be a number."
        exit 1
    fi
fi

# Handle different commands
case $1 in
    balance)
        # Get the user's current wallet balance
        curl "${URL}:${PORT}/balance"
        ;;
    transactions)
        # Get the transactions of the latest block of the chain
        transactions=$(curl "${URL}:${PORT}/transaction" | jq -r '.transactions')
        # Use jq to parse the JSON output
        # and format it as a table
        echo "recipientId   transactionType   senderAddress   recipientAddress   amount   timestamp" | column -t -s $'\t'
        echo "$transactions" | jq -r '.[] | "\(.recipientId)   \(.transactionType)   \(.senderAddress[0:6] + "...")   \(.recipientAddress[0:6] + "...")   \(.amount)   \(.timestamp)"' | column -t -s $'\t\t\t'
        ;;
    transaction)
        # Create a new transaction
        curl -X POST "${URL}:${PORT}/transaction" -H "Content-Type: application/json" -d '{"recipientId": "'"$2"'", "amount": "'"$3"'"}'
        ;;
    help)
        show_help
        ;;
    *)
        echo "Invalid command. Run 'help' for a list of commands."
        ;;
esac
