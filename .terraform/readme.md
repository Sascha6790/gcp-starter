# Terraform Local Testing Guide

This document explains how to set up, test, and apply Terraform configurations for the PR preview database environments locally.

## Prerequisites

- Terraform CLI installed (version 1.0.0 or newer)
- Google Cloud SDK (gcloud) installed
- Appropriate GCP permissions for the project

## Setup and Authentication

1. Authenticate with Google Cloud:
   ```bash
   gcloud auth application-default login
   ```

2. Initialize Terraform in the `.terraform` directory:
   ```bash
   terraform init
   ```

## Testing and Applying Configurations

### Prepare Variables

You can either:
- Create a `terraform.tfvars` file based on the template
- Pass variables via command line (as shown below)

### Plan Changes

Review what Terraform will create or change:

```bash
terraform plan \
  -var="project_id=qualified-gist-454616-m5" \
  -var="pr_number=123" \
  -var="db_password=test-password"
```

### Apply Changes

Apply the configuration to create or update resources:

```bash
terraform apply \
  -var="project_id=qualified-gist-454616-m5" \
  -var="pr_number=123" \
  -var="db_password=test-password"
```

When prompted, review the planned changes and confirm by typing `yes`.

### Clean Up Resources

Remove all resources created by this configuration:

```bash
terraform destroy \
  -var="project_id=qualified-gist-454616-m5" \
  -var="pr_number=123" \
  -var="db_password=test-password"
```

When prompted, confirm by typing `yes`.

## Notes

- The PR number is used as part of resource names for isolation
- Always destroy resources when testing is complete to avoid unnecessary charges
- Use unique PR numbers for each test to prevent conflicts
