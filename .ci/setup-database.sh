#!/bin/bash
set -e

# Usage: ./setup-database.sh <PR_NUMBER>
# Script to set up a postgres database for a PR preview environment

# Get parameters from environment if available, otherwise use defaults
PR_NUMBER=$1
PROJECT_ID="qualified-gist-454616-m5"
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

# Import Resources Function
import_terraform_resources() {
  local PR_NUMBER=$1
  local PROJECT_ID=$2
  local REGION=$3
  local DB_PASSWORD=$4

  local resources=(
    "google_compute_network.pr_vpc_network projects/${PROJECT_ID}/global/networks/pr-${PR_NUMBER}-vpc"
    "google_compute_subnetwork.pr_subnet projects/${PROJECT_ID}/regions/${REGION}/subnetworks/pr-${PR_NUMBER}-subnet"
    "google_compute_global_address.private_ip_address projects/${PROJECT_ID}/global/addresses/pr-${PR_NUMBER}-db-ip"
    "google_service_networking_connection.private_vpc_connection projects/${PROJECT_ID}/global/networks/pr-${PR_NUMBER}-vpc:servicenetworking.googleapis.com"
    "google_sql_database_instance.postgres_instance pr-${PR_NUMBER}-postgres"
    "google_sql_database.database ${PROJECT_ID}/pr-${PR_NUMBER}-postgres/pr_${PR_NUMBER}_db"
    "google_sql_user.users ${PROJECT_ID}/pr-${PR_NUMBER}-postgres/pr_user"
    "google_vpc_access_connector.connector projects/${PROJECT_ID}/locations/${REGION}/connectors/pr-${PR_NUMBER}-vpc-connector"
    "google_project_service.vpcaccess_api ${PROJECT_ID}/vpcaccess.googleapis.com"
    "google_project_service.servicenetworking_api ${PROJECT_ID}/servicenetworking.googleapis.com"
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
      "$resource" "$id" 2>/dev/null; then
      echo "Successfully imported $resource"
    else
      echo "WARNING: Could not import $resource. Continuing..."
    fi
  done
}

# Get SQL Instance IP
get_sql_instance_ip() {
  local PR_NUMBER=$1
  local PROJECT_ID=$2

  echo "Getting IP address for SQL instance pr-${PR_NUMBER}-postgres..."

  # Try to get the private IP address of the SQL instance
  local IP=$(gcloud sql instances describe "pr-${PR_NUMBER}-postgres" \
    --project="${PROJECT_ID}" \
    --format="get(ipAddresses[0].ipAddress)")

  if [ -z "$IP" ]; then
    echo "WARNING: Could not find private IP for SQL instance, falling back to instance name"
    echo "pr-${PR_NUMBER}-postgres"
  else
    echo "$IP"
  fi
}

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
DB_HOST_IP=$(get_sql_instance_ip "$PR_NUMBER" "$PROJECT_ID" | grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -n1)

echo "DB_INSTANCE_NAME=$DB_INSTANCE_NAME" >> "$GITHUB_ENV"
echo "DB_NAME=$DB_NAME" >> "$GITHUB_ENV"
echo "DB_CONNECTION_NAME=$DB_CONNECTION_NAME" >> "$GITHUB_ENV"
echo "VPC_CONNECTOR_NAME=$VPC_CONNECTOR_NAME" >> "$GITHUB_ENV"
echo "DB_PASSWORD=$DB_PASSWORD" >> "$GITHUB_ENV"
echo "DB_USERNAME=pr_user" >> "$GITHUB_ENV"
echo "DB_HOST=$DB_HOST_IP" >> "$GITHUB_ENV"

echo "db_instance_name=$DB_INSTANCE_NAME" >> "$GITHUB_OUTPUT"
echo "db_name=$DB_NAME" >> "$GITHUB_OUTPUT"
echo "db_username=pr_user" >> "$GITHUB_OUTPUT"
echo "db_password=$DB_PASSWORD" >> "$GITHUB_OUTPUT"
echo "db_connection_name=$DB_CONNECTION_NAME" >> "$GITHUB_OUTPUT"
echo "vpc_connector_name=$VPC_CONNECTOR_NAME" >> "$GITHUB_OUTPUT"
echo "db_host=$DB_HOST_IP" >> "$GITHUB_OUTPUT"

echo "Setting GitHub environment variables and outputs..."

echo "DB_INSTANCE_NAME: $DB_INSTANCE_NAME"
echo "DB_NAME: $DB_NAME"
echo "DB_CONNECTION_NAME: $DB_CONNECTION_NAME"
echo "VPC_CONNECTOR_NAME: $VPC_CONNECTOR_NAME"
echo "DB_USERNAME: pr_user"
echo "DB_HOST: $DB_HOST_IP"


cd ..
