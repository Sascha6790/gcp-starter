#!/usr/bin/env node

const { getSqlInstanceIp } = require('./terraform-utils');

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

const requiredParams = ['pr-number', 'project-id'];
const missingParams = requiredParams.filter(param => !params[param]);

if (missingParams.length > 0) {
  console.error(`Error: Missing required parameters: ${missingParams.join(', ')}`);
  process.exit(1);
}

const ip = getSqlInstanceIp(params['pr-number'], params['project-id']);
console.log(ip);
