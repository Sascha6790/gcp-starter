#!/bin/bash
set -e

# Usage: ./setup-database.sh <PR_NUMBER>
# Script to set up a postgres database for a PR preview environment

# Get parameters from environment if available, otherwise use defaults
PR_NUMBER=$1
PROJECT_ID=${GCP_PROJECT_ID:-"qualified-gist-454616-m5"}
REGION=${GCP_REGION:-"europe-west3"}
TERRAFORM_DIR=".terraform"

# Generate random password (alphanumeric only to avoid sed issues)
DB_PASSWORD=$(openssl rand -hex 12)

# Initialize terraform directory
cd $TERRAFORM_DIR

# Create terraform.tfvars file from template with the PR number
# Use alternative delimiter in sed to avoid issues with special characters
sed -e "s/PR_NUMBER/$PR_NUMBER/g" \
    -e "s|GENERATED_PASSWORD|$DB_PASSWORD|g" \
    terraform.tfvars.template > terraform.tfvars

# Initialize Terraform
terraform init

# Import shared functions
source $(dirname "$0")/terraform-common.sh

# Import existing resources
import_terraform_resources "$PR_NUMBER" "$PROJECT_ID" "$REGION" "$DB_PASSWORD"

# First try a plan to see what happens
terraform plan -out=tf.plan || {
  echo "Terraform plan failed. This might be because of configuration issues."
  echo "Attempting to continue with apply anyway due to lifecycle.ignore_changes settings."
}

# Apply Terraform configuration with auto-approve
terraform apply -auto-approve

# Export outputs
DB_INSTANCE_NAME=$(terraform output -raw db_instance_name)
DB_NAME=$(terraform output -raw db_name)
DB_CONNECTION_NAME=$(terraform output -raw db_connection_name)
VPC_CONNECTOR_NAME=$(terraform output -raw vpc_connector_name)

# Get DB Host IP
DB_HOST_IP=$(get_sql_instance_ip "$PR_NUMBER" "$PROJECT_ID")

# Output values as environment variables for GitHub Actions
echo "DB_INSTANCE_NAME=$DB_INSTANCE_NAME" >> $GITHUB_ENV
echo "DB_NAME=$DB_NAME" >> $GITHUB_ENV
echo "DB_CONNECTION_NAME=$DB_CONNECTION_NAME" >> $GITHUB_ENV
echo "VPC_CONNECTOR_NAME=$VPC_CONNECTOR_NAME" >> $GITHUB_ENV
echo "DB_PASSWORD=$DB_PASSWORD" >> $GITHUB_ENV
echo "DB_USERNAME=pr_user" >> $GITHUB_ENV
echo "DB_HOST=$DB_HOST_IP" >> $GITHUB_ENV

# Set secrets for the PR deployment
echo "::set-output name=db_instance_name::$DB_INSTANCE_NAME"
echo "::set-output name=db_name::$DB_NAME"
echo "::set-output name=db_username::pr_user"
echo "::set-output name=db_password::$DB_PASSWORD"
echo "::set-output name=db_connection_name::$DB_CONNECTION_NAME"
echo "::set-output name=vpc_connector_name::$VPC_CONNECTOR_NAME"
echo "::set-output name=db_host::$DB_HOST_IP"

cd ..
