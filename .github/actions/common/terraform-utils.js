const { execSync } = require('child_process');
const path = require('path');

/**
 * Import terraform resources based on PR number and project settings
 * @param {string} prNumber - The PR number
 * @param {string} projectId - GCP project ID
 * @param {string} region - GCP region
 * @param {string} dbPassword - Database password
 * @param {string} terraformDir - Terraform directory
 */
function importTerraformResources(prNumber, projectId, region, dbPassword, terraformDir) {
  console.log('Starting import of existing resources...');

  const resources = [
    `google_compute_network.pr_vpc_network projects/${projectId}/global/networks/pr-${prNumber}-vpc`,
    `google_compute_subnetwork.pr_subnet projects/${projectId}/regions/${region}/subnetworks/pr-${prNumber}-subnet`,
    `google_compute_global_address.private_ip_address projects/${projectId}/global/addresses/pr-${prNumber}-db-ip`,
    `google_service_networking_connection.private_vpc_connection ${projectId}/servicenetworking.googleapis.com`,
    `google_sql_database_instance.postgres_instance pr-${prNumber}-postgres`,
    `google_sql_database.database pr-${prNumber}-postgres:pr_${prNumber}_db`,
    `google_sql_user.users pr-${prNumber}-postgres/pr_user`,
    `google_vpc_access_connector.connector projects/${projectId}/locations/${region}/connectors/pr-${prNumber}-vpc-connector`,
    `google_project_service.vpcaccess_api ${projectId}/vpcaccess.googleapis.com`,
    `google_project_service.servicenetworking_api ${projectId}/servicenetworking.googleapis.com`
  ];

  // Change to terraform directory
  const currentDir = process.cwd();
  process.chdir(path.join(currentDir, terraformDir));

  resources.forEach(resource => {
    const [resourceName, resourceId] = resource.split(' ');
    console.log(`Attempting to import: ${resourceName} ${resourceId}`);

    try {
      execSync(`terraform import \
        -var="project_id=${projectId}" \
        -var="pr_number=${prNumber}" \
        -var="db_password=${dbPassword}" \
        -var="region=${region}" \
        "${resourceName}" "${resourceId}"`, { stdio: 'inherit' });
      console.log(`Successfully imported ${resourceName}`);
    } catch (error) {
      console.log(`WARNING: Could not import ${resourceName}. Continuing...`);
    }
  });

  // Change back to original directory
  process.chdir(currentDir);
}

/**
 * Get the private IP address of an SQL instance
 * @param {string} prNumber - The PR number
 * @param {string} projectId - GCP project ID
 * @returns {string} - IP address or instance name as fallback
 */
function getSqlInstanceIp(prNumber, projectId) {
  console.log(`Getting IP address for SQL instance pr-${prNumber}-postgres...`);

  try {
    const output = execSync(`gcloud sql instances describe "pr-${prNumber}-postgres" \
      --project="${projectId}" \
      --format="value(ipAddresses.filter(ipType='PRIVATE').get(0).ipAddress)"`).toString().trim();

    if (output) {
      console.log(`Found private IP for SQL instance: ${output}`);
      return output;
    }
  } catch (error) {
    console.log(`Error finding private IP: ${error.message}`);
  }

  console.log('WARNING: Could not find private IP for SQL instance, falling back to instance name');
  return `pr-${prNumber}-postgres`;
}

module.exports = {
  importTerraformResources,
  getSqlInstanceIp
};
