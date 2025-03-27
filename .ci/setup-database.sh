#!/bin/bash
set -e

# Usage: ./setup-database.sh <PR_NUMBER>
# Script to set up a postgres database for a PR preview environment

PR_NUMBER=$1
PROJECT_ID="qualified-gist-454616-m5"
REGION="europe-west3"
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

# Import Resources Function
import_resources() {
  local resources=(
    "google_compute_network.pr_vpc_network projects/${PROJECT_ID}/global/networks/pr-${PR_NUMBER}-vpc"
    "google_compute_subnetwork.pr_subnet projects/${PROJECT_ID}/regions/${REGION}/subnetworks/pr-${PR_NUMBER}-subnet"
    "google_compute_global_address.private_ip_address pr-${PR_NUMBER}-db-ip"
    "google_service_networking_connection.private_vpc_connection ${PROJECT_ID}/${REGION}/pr-${PR_NUMBER}-vpc"
    "google_sql_database_instance.postgres_instance pr-${PR_NUMBER}-postgres"
    "google_sql_database.database pr-${PR_NUMBER}-postgres/pr_${PR_NUMBER}_db"
    "google_sql_user.users pr-${PR_NUMBER}-postgres/pr_user"
    "google_vpc_access_connector.connector pr-${PR_NUMBER}-vpc-connector"
    "google_project_service.vpcaccess_api vpcaccess.googleapis.com"
    "google_project_service.servicenetworking_api servicenetworking.googleapis.com"
  )

  echo "Starting import of existing resources..."

  for resource_info in "${resources[@]}"; do
    read -r resource id <<< "$resource_info"

    echo "Attempting to import: $resource $id"

    # Attempt import with error handling
    if terraform import \
      -var="project_id=${PROJECT_ID}" \
      -var="pr_number=${PR_NUMBER}" \
      -var="db_password=${DB_PASSWORD}" \
      -var="region=${REGION}" \
      "$resource" "$id"; then
      echo "Successfully imported $resource"
    else
      echo "WARNING: Could not import $resource. Continuing..."
    fi
  done
}

# Import existing resources
import_resources

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
