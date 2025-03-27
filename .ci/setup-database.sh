#!/bin/bash
set -e

# Usage: ./setup-database.sh <PR_NUMBER>
# Script to set up a postgres database for a PR preview environment

PR_NUMBER=$1
PROJECT_ID="qualified-gist-454616-m5"
REGION="europe-west3"
TERRAFORM_DIR=".terraform"

# Debug Google credentials
echo "INFO: Using Google credentials from: $GOOGLE_APPLICATION_CREDENTIALS"
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "ERROR: GOOGLE_APPLICATION_CREDENTIALS is not set"
  exit 1
elif [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "ERROR: Credentials file does not exist: $GOOGLE_APPLICATION_CREDENTIALS"
  exit 1
else
  echo "INFO: Credentials file exists"
  # Print service account email without showing the actual key
  grep -o '"client_email":"[^"]*"' "$GOOGLE_APPLICATION_CREDENTIALS" || echo "WARNING: Could not extract client_email from credentials"
fi

# Generate random password (alphanumeric only to avoid sed issues)
DB_PASSWORD=$(openssl rand -hex 12)

# Initialize terraform directory
cd $TERRAFORM_DIR

# Create terraform.tfvars file from template with the PR number
# Use alternative delimiter in sed to avoid issues with special characters
sed -e "s/PR_NUMBER/$PR_NUMBER/g" \
    -e "s|GENERATED_PASSWORD|$DB_PASSWORD|g" \
    terraform.tfvars.template > terraform.tfvars

# Initialize Terraform with special import mode
terraform init

# First try a plan to see what happens
terraform plan -out=tf.plan || {
  echo "Terraform plan failed. This might be because resources already exist."
  echo "Attempting to continue with apply anyway due to lifecycle.ignore_changes settings."
}

# Apply Terraform configuration with auto-approve
terraform apply -auto-approve

# Export outputs
DB_INSTANCE_NAME=$(terraform output -raw db_instance_name)
DB_NAME=$(terraform output -raw db_name)
DB_CONNECTION_NAME=$(terraform output -raw db_connection_name)
VPC_CONNECTOR_NAME=$(terraform output -raw vpc_connector_name)

# Output values as environment variables for GitHub Actions
echo "DB_INSTANCE_NAME=$DB_INSTANCE_NAME" >> $GITHUB_ENV
echo "DB_NAME=$DB_NAME" >> $GITHUB_ENV
echo "DB_CONNECTION_NAME=$DB_CONNECTION_NAME" >> $GITHUB_ENV
echo "VPC_CONNECTOR_NAME=$VPC_CONNECTOR_NAME" >> $GITHUB_ENV
echo "DB_PASSWORD=$DB_PASSWORD" >> $GITHUB_ENV
echo "DB_USERNAME=pr_user" >> $GITHUB_ENV

# Set secrets for the PR deployment
echo "::set-output name=db_instance_name::$DB_INSTANCE_NAME"
echo "::set-output name=db_name::$DB_NAME"
echo "::set-output name=db_username::pr_user"
echo "::set-output name=db_password::$DB_PASSWORD"
echo "::set-output name=db_connection_name::$DB_CONNECTION_NAME"
echo "::set-output name=vpc_connector_name::$VPC_CONNECTOR_NAME"

cd ..
