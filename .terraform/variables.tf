variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  default     = "europe-west3"
  type        = string
}

variable "pr_number" {
  description = "The PR number for which resources are created"
  type        = string
}

variable "db_password" {
  description = "The database user password"
  type        = string
  sensitive   = true
}
