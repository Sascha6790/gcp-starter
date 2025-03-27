#!/usr/bin/env node

const { importTerraformResources } = require('./terraform-utils');

const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2).split('=')[0];
    const value = args[i].includes('=') ? args[i].split('=')[1] : args[i+1];
    params[key] = value;
    if (!args[i].includes('=')) i++;
  }
}

const requiredParams = ['pr-number', 'project-id', 'region', 'db-password', 'terraform-dir'];
const missingParams = requiredParams.filter(param => !params[param]);

if (missingParams.length > 0) {
  console.error(`Error: Missing required parameters: ${missingParams.join(', ')}`);
  process.exit(1);
}

if (params['import-resources']) {
  importTerraformResources(
    params['pr-number'],
    params['project-id'],
    params['region'],
    params['db-password'],
    params['terraform-dir']
  );
}
