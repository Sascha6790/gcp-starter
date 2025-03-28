#!/bin/bash
# Gemeinsame Funktionen für Terraform-Skripts

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
    "google_service_networking_connection.private_vpc_connection ${PROJECT_ID}/servicenetworking.googleapis.com"
    "google_sql_database_instance.postgres_instance pr-${PR_NUMBER}-postgres"
    "google_sql_database.database pr-${PR_NUMBER}-postgres:pr_${PR_NUMBER}_db"
    "google_sql_user.users pr-${PR_NUMBER}-postgres/pr_user"
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
    --format="value(ipAddresses.filter(ipType='PRIVATE').get(0).ipAddress)")

  if [ -z "$IP" ]; then
    echo "WARNING: Could not find private IP for SQL instance, falling back to instance name"
    echo "pr-${PR_NUMBER}-postgres"
  else
    echo "$IP"
  fi
}
