terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  # Explicitly rely on GOOGLE_APPLICATION_CREDENTIALS environment variable
  # or use the default ~/.config/gcloud/application_default_credentials.json
}

resource "google_compute_network" "pr_vpc_network" {
  name                    = "pr-${var.pr_number}-vpc"
  auto_create_subnetworks = false
  lifecycle {
    # Ignore the resource if it already exists
    ignore_changes = all
  }
}

resource "google_compute_subnetwork" "pr_subnet" {
  name          = "pr-${var.pr_number}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.pr_vpc_network.id
  lifecycle {
    ignore_changes = all
  }
}

resource "google_compute_global_address" "private_ip_address" {
  name          = "pr-${var.pr_number}-db-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.pr_vpc_network.id
  lifecycle {
    ignore_changes = all
  }
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.pr_vpc_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
  lifecycle {
    ignore_changes = all
  }
}

resource "google_sql_database_instance" "postgres_instance" {
  name             = "pr-${var.pr_number}-postgres"
  database_version = "POSTGRES_17"
  region           = var.region
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro"
    disk_size = 10
    edition = "ENTERPRISE"

    availability_type = "ZONAL"

    backup_configuration {
      enabled = false
    }

    deletion_protection_enabled = false

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.pr_vpc_network.id
    }
  }

  lifecycle {
    ignore_changes = all
  }
}

resource "google_sql_database" "database" {
  name     = "pr_${var.pr_number}_db"
  instance = google_sql_database_instance.postgres_instance.name
}

resource "google_sql_user" "users" {
  name     = "pr_user"
  instance = google_sql_database_instance.postgres_instance.name
  password = var.db_password
  depends_on = [google_sql_database.database]
}

resource "google_vpc_access_connector" "connector" {
  name          = "pr-${var.pr_number}-vpc-connector"
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.pr_vpc_network.name
  region        = var.region
  lifecycle {
    ignore_changes = all
  }
}

resource "google_project_service" "vpcaccess_api" {
  service = "vpcaccess.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "servicenetworking_api" {
  service = "servicenetworking.googleapis.com"
  disable_on_destroy = false
}

output "db_instance_name" {
  value = google_sql_database_instance.postgres_instance.name
}

output "db_name" {
  value = google_sql_database.database.name
}

output "db_connection_name" {
  value = google_sql_database_instance.postgres_instance.connection_name
}

output "vpc_connector_name" {
  value = google_vpc_access_connector.connector.name
}
