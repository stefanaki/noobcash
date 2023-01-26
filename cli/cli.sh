#!/bin/bash

# Noobcash CLI

# Georgios Stefanakis
# Odyssefs-Dimitrios Boufalis
# Nikolaos Fotis

# Get the URL and PORT from environment variables
URL="$URL"
PORT="$PORT"

# Function to handle errors
handle_error() {
  echo "An error occurred: $1"
  exit 1
}

# Function to make a GET request to the balance endpoint
get_balance() {
  response=$(curl -s "${URL}:${PORT}/balance")

  # Check if the request was successful
  if [ $? -ne 0 ]; then
    handle_error "Failed to make GET request to ${URL}:${PORT}/balance"
  fi

  # Get the balance from the response body
  balance=$(echo $response | jq -r '.balance')

  # Check if the balance was found in the response
  if [ -z "$balance" ]; then
    handle_error "Failed to find balance in response"
  fi

  echo "Your wallet balance is ${balance} NBC."
}

# Function to make a POST request to the transaction endpoint
make_transaction() {
  response=$(curl -s -X POST "${URL}:${PORT}/transaction" -d "recipient_id=$1" -d "amount=$2")

  # Check if the request was successful
  if [ $? -ne 0 ]; then
    handle_error "Failed to make POST request to ${URL}:${PORT}/transaction"
  fi

  # Get the transaction status from the response body
  status=$(echo $response | jq -r '.message')

  # Check if the status was found in the response
  if [ -z "$status" ]; then
    handle_error "Failed to find status in response"
  fi

  echo "Transaction status: ${status}."
}

# Function to make a GET request to the view endpoint
view_transactions() {
  response=$(curl -s "${URL}:${PORT}/view")

  # Check if the request was successful
  if [ $? -ne 0 ]; then
    handle_error "Failed to make GET request to ${URL}:${PORT}/view"
  fi

  # Get the transactions from the response body
  transactions=$(echo $response | jq -r '.transactions')

  # Check if the transactions were found in the response
  if [ -z "$transactions" ]; then
    handle_error "Failed to find transactions in response"
  fi

  echo "Transactions:"
  echo "$transactions"
}

# Main command
if [ "$1" == "balance" ]; then
  get_balance
elif [ "$1" == "transaction" ]; then
  if [ "$#" -ne 3 ]; then
    echo "Invalid number of arguments. Usage: transaction <recipient_id> <amount>"
  else
    make_transaction "$2" "$3"
  fi
elif [ "$1" == "view" ]; then
  view_transactions
elif [ "$1" == "help" ]; then
  echo "Commands:"
  echo "balance - view your wallet balance"
  echo "transaction <recipient_id> <amount> - make a transaction to the specified recipient with the specified amount"
  echo "view - view all transactions"
  echo "help - view this help message"
else
  echo "Invalid command. Use 'help' to see available commands."
fi
