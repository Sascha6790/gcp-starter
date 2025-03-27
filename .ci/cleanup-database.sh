#!/bin/bash
set -e

# Usage: ./cleanup-database.sh <PR_NUMBER>
# Script to clean up postgres database and VPC for a PR preview environment

PR_NUMBER=$1
PROJECT_ID="qualified-gist-454616-m5"
REGION="europe-west3"
TERRAFORM_DIR=".terraform"

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

# Destroy Terraform-managed resources
terraform destroy -auto-approve

cd ..
