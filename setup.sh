#!/bin/bash

# MANTRA EVM dApp Template Setup Script
# This script configures the template with your project name

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      MANTRA EVM dApp Template - Setup Script             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Get the current directory name as default project name
CURRENT_DIR=$(basename "$PWD")
DEFAULT_PROJECT_NAME="${CURRENT_DIR}"

# Prompt for project name
echo "This script will customize the template with your project details."
echo ""
read -p "Enter your project name (default: ${DEFAULT_PROJECT_NAME}): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-$DEFAULT_PROJECT_NAME}

# Validate project name
if [[ ! "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "❌ Error: Project name must contain only lowercase letters, numbers, and hyphens"
  exit 1
fi

# Prompt for project title (for display)
DEFAULT_TITLE=$(echo "$PROJECT_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
read -p "Enter your project title for display (default: ${DEFAULT_TITLE}): " PROJECT_TITLE
PROJECT_TITLE=${PROJECT_TITLE:-$DEFAULT_TITLE}

# Prompt for GitHub username/org (optional)
read -p "Enter your GitHub username or organization (optional, press Enter to skip): " GITHUB_USER

echo ""
echo "Configuration Summary:"
echo "  Project Name:  ${PROJECT_NAME}"
echo "  Project Title: ${PROJECT_TITLE}"
if [ -n "$GITHUB_USER" ]; then
  echo "  GitHub:        https://github.com/${GITHUB_USER}/${PROJECT_NAME}"
fi
echo ""
read -p "Proceed with these settings? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Setup cancelled."
  exit 0
fi

echo ""
echo "🔧 Configuring your project..."

# Create backup of original files (in case something goes wrong)
echo "📦 Creating backups..."
cp package.json package.json.backup
cp packages/webapp/package.json packages/webapp/package.json.backup
cp packages/webapp/index.html packages/webapp/index.html.backup
cp packages/webapp/wrangler.toml packages/webapp/wrangler.toml.backup
cp README.md README.md.backup

# Replace project name in root package.json
echo "📝 Updating root package.json..."
sed -i.tmp "s/\"name\": \"dapp-evm\"/\"name\": \"${PROJECT_NAME}\"/" package.json
sed -i.tmp "s/@dapp-evm\/webapp/@${PROJECT_NAME}\/webapp/g" package.json
rm package.json.tmp

# Replace project name in webapp package.json
echo "📝 Updating webapp package.json..."
sed -i.tmp "s/\"name\": \"@dapp-evm\/webapp\"/\"name\": \"@${PROJECT_NAME}\/webapp\"/" packages/webapp/package.json
rm packages/webapp/package.json.tmp

# Replace title in index.html
echo "📝 Updating index.html..."
sed -i.tmp "s/<title>dapp-evm<\/title>/<title>${PROJECT_TITLE}<\/title>/" packages/webapp/index.html
rm packages/webapp/index.html.tmp

# Replace name in wrangler.toml
echo "📝 Updating wrangler.toml..."
sed -i.tmp "s/name = \"dapp-template-evm\"/name = \"${PROJECT_NAME}\"/" packages/webapp/wrangler.toml
rm packages/webapp/wrangler.toml.tmp

# Update README.md
echo "📝 Updating README.md..."
if [ -n "$GITHUB_USER" ]; then
  sed -i.tmp "s/git clone https:\/\/github.com\/mantramatt\/dapp-template-evm.git/git clone https:\/\/github.com\/${GITHUB_USER}\/${PROJECT_NAME}.git/" README.md
  sed -i.tmp "s/cd dapp-template-evm/cd ${PROJECT_NAME}/" README.md
else
  sed -i.tmp "s/git clone https:\/\/github.com\/mantramatt\/dapp-template-evm.git/# Clone your repository\ngit clone https:\/\/github.com\/YOUR_USERNAME\/${PROJECT_NAME}.git/" README.md
  sed -i.tmp "s/cd dapp-template-evm/cd ${PROJECT_NAME}/" README.md
fi
sed -i.tmp "s/dapp-template-evm\//${PROJECT_NAME}\//" README.md
rm README.md.tmp

# Remove documentation files created during development
echo "🧹 Cleaning up development documentation..."


# Remove backup files
echo "🧹 Removing backup files..."
rm -f package.json.backup
rm -f packages/webapp/package.json.backup
rm -f packages/webapp/index.html.backup
rm -f packages/webapp/wrangler.toml.backup
rm -f README.md.backup

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Review the changes made to your configuration files"
echo "  2. Update .env files with your private keys and contract addresses"
echo "  3. Customize the dApp UI to match your project needs"
echo "  4. Deploy your smart contracts: yarn contracts:deploy:dukong"
echo "  5. Start the development server: yarn dev"
echo ""
echo "📚 Documentation: See README.md for detailed instructions"
echo ""
echo "🎉 Happy building on MANTRA!"
echo ""

# Self-destruct this setup script (optional)
read -p "Delete this setup script now that configuration is complete? (y/N): " DELETE_SCRIPT
if [[ "$DELETE_SCRIPT" =~ ^[Yy]$ ]]; then
  echo "🗑️  Removing setup script..."
  rm -- "$0"
  echo "✅ Setup script deleted."
fi
