#!/bin/bash
set -e

# Usage: ./cleanup-database.sh <PR_NUMBER>
# Script to clean up postgres database and VPC for a PR preview environment

# Get parameters from environment if available, otherwise use defaults
PR_NUMBER=$1
PROJECT_ID=${GCP_PROJECT_ID:-"qualified-gist-454616-m5"}
REGION=${GCP_REGION:-"europe-west3"}
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

# Initialize terraform directory
cd $TERRAFORM_DIR

# Create terraform.tfvars file from template with the PR number
# Password value is not important for destroy
# Use alternative delimiter in sed to avoid issues with special characters
sed -e "s/PR_NUMBER/$PR_NUMBER/g" \
    -e "s|GENERATED_PASSWORD|dummy-password|g" \
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
    "google_service_networking_connection.private_vpc_connection projects/${PROJECT_ID}/global/networks/pr-${PR_NUMBER}-vpc/servicenetworking.googleapis.com"
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

# Import existing resources before destroying them
import_terraform_resources "$PR_NUMBER" "$PROJECT_ID" "$REGION" "dummy-password"

# Destroy Terraform-managed resources
terraform destroy -auto-approve

cd ..
