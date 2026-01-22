#!/bin/bash

# ConvertKing DigitalOcean Setup Script
# Run this on your Ubuntu droplet after connecting via SSH

echo "🚀 Setting up ConvertKing on DigitalOcean..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
echo "📦 Installing FFmpeg..."
sudo apt install -y ffmpeg

# Install build essentials (required for some npm packages like canvas)
echo "📦 Installing build essentials..."
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Verify installations
echo "✅ Verifying installations..."
node --version
npm --version
ffmpeg -version

# Install PM2 globally (process manager)
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/convertking
sudo chown -R $USER:$USER /var/www/convertking

# Configure UFW firewall
echo "🔒 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 5000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ DigitalOcean setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your server code to /var/www/convertking"
echo "2. Run: cd /var/www/convertking/server && npm install"
echo "3. Run: pm2 start ecosystem.config.js"
echo "4. Run: pm2 save && pm2 startup"
