#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = join(__dirname, '..');
const PROJECT_ROOT = join(BACKEND_DIR, '..');
const CONFIG_PATH = join(BACKEND_DIR, '.deploy-config.json');
const SAMCONFIG_PATH = join(BACKEND_DIR, 'samconfig.toml');
const ENV_PATH = join(PROJECT_ROOT, '.env');

// Default configuration
const DEFAULTS = {
  region: 'us-west-2',
  stackName: 'vocabulary-sync',
  allowedOrigins: '*',
  lambdaMemory: 256,
  lambdaTimeout: 10,
};

// Helper to run commands
function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: BACKEND_DIR, ...options });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

// Helper to prompt user
async function prompt(question, defaultValue) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const displayDefault = defaultValue !== undefined ? ` [${defaultValue}]` : '';
    rl.question(`${question}${displayDefault}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Check prerequisites
function checkPrerequisites() {
  console.log('\n=== Checking prerequisites ===\n');

  // Check AWS CLI
  try {
    execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    console.log('✓ AWS CLI configured');
  } catch {
    console.error('✗ AWS CLI not configured. Run: aws configure');
    process.exit(1);
  }

  // Check SAM CLI
  try {
    execSync('sam --version', { stdio: 'pipe' });
    console.log('✓ SAM CLI installed');
  } catch {
    console.error('✗ SAM CLI not installed. Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html');
    process.exit(1);
  }
}

// Load or prompt for configuration
async function loadConfig() {
  console.log('\n=== Loading configuration ===\n');

  let config = { ...DEFAULTS };

  // Load existing config if present
  if (existsSync(CONFIG_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...existing };
      console.log('Loaded existing configuration from .deploy-config.json');
    } catch (err) {
      console.warn('Warning: Could not parse .deploy-config.json, using defaults');
    }
  }

  // Check if we should use existing config or prompt
  const useExisting = process.argv.includes('--yes') || process.argv.includes('-y');

  if (!useExisting) {
    console.log('\nPress Enter to use defaults, or type a new value:\n');

    config.region = await prompt('AWS Region', config.region);
    config.stackName = await prompt('Stack Name', config.stackName);
    config.allowedOrigins = await prompt('Allowed Origins (CORS)', config.allowedOrigins);

    const memoryStr = await prompt('Lambda Memory (MB, 128-10240)', String(config.lambdaMemory));
    config.lambdaMemory = parseInt(memoryStr, 10);

    const timeoutStr = await prompt('Lambda Timeout (seconds, 1-900)', String(config.lambdaTimeout));
    config.lambdaTimeout = parseInt(timeoutStr, 10);
  }

  // Validate
  if (config.lambdaMemory < 128 || config.lambdaMemory > 10240) {
    console.error('Invalid Lambda memory. Must be 128-10240 MB.');
    process.exit(1);
  }

  if (config.lambdaTimeout < 1 || config.lambdaTimeout > 900) {
    console.error('Invalid Lambda timeout. Must be 1-900 seconds.');
    process.exit(1);
  }

  // Save config
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('\nConfiguration saved to .deploy-config.json');

  return config;
}

// Generate samconfig.toml
function generateSamConfig(config) {
  console.log('\n=== Generating samconfig.toml ===\n');

  const parameterOverrides = [
    `AllowedOrigins=${config.allowedOrigins}`,
    `LambdaMemory=${config.lambdaMemory}`,
    `LambdaTimeout=${config.lambdaTimeout}`,
  ].join(' ');

  const samconfig = `version = 0.1
[default.deploy.parameters]
stack_name = "${config.stackName}"
region = "${config.region}"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "${parameterOverrides}"
resolve_s3 = true
`;

  writeFileSync(SAMCONFIG_PATH, samconfig);
  console.log('Generated samconfig.toml');
}

// Build and deploy
function buildAndDeploy() {
  console.log('\n=== Building ===\n');
  run('npm run build');

  console.log('\n=== Deploying ===\n');
  run('sam build');
  run('sam deploy --no-confirm-changeset --no-fail-on-empty-changeset');
}

// Capture outputs and update frontend .env
function captureOutputs(config) {
  console.log('\n=== Capturing stack outputs ===\n');

  try {
    const outputsJson = execSync(
      `aws cloudformation describe-stacks --stack-name ${config.stackName} --query "Stacks[0].Outputs" --output json --region ${config.region}`,
      { encoding: 'utf8', cwd: BACKEND_DIR }
    );

    const outputs = JSON.parse(outputsJson);
    const apiUrlOutput = outputs.find((o) => o.OutputKey === 'VocabularySyncApiUrl');

    if (!apiUrlOutput) {
      console.error('Could not find VocabularySyncApiUrl in stack outputs');
      return;
    }

    const apiUrl = apiUrlOutput.OutputValue;
    console.log(`API URL: ${apiUrl}`);

    // Update or create frontend .env
    let envContent = '';
    if (existsSync(ENV_PATH)) {
      envContent = readFileSync(ENV_PATH, 'utf8');
    }

    // Update or add EXPO_PUBLIC_SYNC_API_URL
    const envVar = `EXPO_PUBLIC_SYNC_API_URL=${apiUrl}`;
    if (envContent.includes('EXPO_PUBLIC_SYNC_API_URL=')) {
      envContent = envContent.replace(/EXPO_PUBLIC_SYNC_API_URL=.*/g, envVar);
    } else {
      envContent = envContent.trim() + (envContent ? '\n' : '') + envVar + '\n';
    }

    writeFileSync(ENV_PATH, envContent);
    console.log(`\nUpdated ${ENV_PATH} with EXPO_PUBLIC_SYNC_API_URL`);
  } catch (err) {
    console.error('Error capturing stack outputs:', err.message);
  }
}

// Main
async function main() {
  console.log('=== Vocabulary Sync Backend Deployment ===');

  checkPrerequisites();
  const config = await loadConfig();
  generateSamConfig(config);
  buildAndDeploy();
  captureOutputs(config);

  console.log('\n=== Deployment complete! ===\n');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
