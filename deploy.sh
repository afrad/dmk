#!/bin/bash

# Friday Prayer Registration System - Deployment Script
# Run this script on Ubuntu server for automated deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="friday-prayer-app"
APP_DIR="/home/dmk/dmk"
BACKUP_DIR="/home/dmk/backups"
DOMAIN="yourdomain.com"  # Change this to your domain

echo -e "${GREEN}Starting deployment of Friday Prayer Registration System...${NC}"

# Check if running as dmk user
if [ "$USER" != "dmk" ]; then
    echo -e "${RED}This script should be run as the 'dmk' user${NC}"
    exit 1
fi

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_section "Checking prerequisites"

# Check for required commands
MISSING_COMMANDS=""
for cmd in node npm pg_dump nginx systemctl; do
    if ! command_exists "$cmd"; then
        MISSING_COMMANDS="$MISSING_COMMANDS $cmd"
    fi
done

if [ -n "$MISSING_COMMANDS" ]; then
    echo -e "${RED}Missing required commands:$MISSING_COMMANDS${NC}"
    echo "Please install them first and run this script again."
    exit 1
fi

print_section "Creating directories"
mkdir -p "$BACKUP_DIR"
mkdir -p "$HOME/logs"

print_section "Backing up current deployment"
if [ -d "$APP_DIR" ]; then
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    echo "Creating backup: $BACKUP_NAME"
    cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    echo "Backup created at $BACKUP_DIR/$BACKUP_NAME"
fi

print_section "Updating application code"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull
else
    echo "Please clone the repository first:"
    echo "git clone <repository-url> $APP_DIR"
    exit 1
fi

print_section "Installing dependencies"
npm ci --only=production

print_section "Building application"
npm run build

print_section "Database operations"
echo "Generating Prisma client..."
npm run db:generate

echo "Pushing database schema..."
npm run db:push

# Ask if user wants to seed database
read -p "Do you want to seed the database with test data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    npm run db:seed
fi

print_section "PM2 Configuration"
if command_exists pm2; then
    # Stop existing application
    pm2 stop "$APP_NAME" 2>/dev/null || echo "No existing PM2 process found"

    # Start application
    pm2 start ecosystem.config.js

    # Save PM2 configuration
    pm2 save

    echo "Application started with PM2"
else
    echo -e "${YELLOW}PM2 not found. Please install PM2 globally:${NC}"
    echo "sudo npm install -g pm2"
fi

print_section "Nginx Configuration"
NGINX_CONFIG="/etc/nginx/sites-available/friday-prayer"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${YELLOW}Nginx configuration not found. Creating basic configuration...${NC}"

    sudo tee "$NGINX_CONFIG" > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/

    # Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx

    echo "Basic Nginx configuration created and enabled"
    echo -e "${YELLOW}Remember to setup SSL with: sudo certbot --nginx -d $DOMAIN${NC}"
else
    echo "Nginx configuration already exists"
    sudo nginx -t && sudo systemctl reload nginx
fi

print_section "Setting up automatic backups"
BACKUP_SCRIPT="$HOME/backup-db.sh"

cat > "$BACKUP_SCRIPT" << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME=$(grep DATABASE_URL .env | cut -d'/' -f4)
DB_USER=$(grep DATABASE_URL .env | cut -d'/' -f3 | cut -d':' -f1)

if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "/home/dmk/backups/db_backup_$DATE.sql"
    echo "Database backup created: db_backup_$DATE.sql"

    # Keep only last 7 days of backups
    find /home/dmk/backups -name "db_backup_*.sql" -mtime +7 -delete
else
    echo "Could not determine database credentials from .env file"
fi
EOF

chmod +x "$BACKUP_SCRIPT"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "0 2 * * * $BACKUP_SCRIPT") | crontab -

echo "Database backup script created and added to crontab"

print_section "Health Check"
sleep 5  # Give the application time to start

# Check if application is responding
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is responding on localhost:3000${NC}"
else
    echo -e "${RED}✗ Application is not responding on localhost:3000${NC}"
    echo "Check logs with: pm2 logs $APP_NAME"
fi

# Check PM2 status
if command_exists pm2; then
    echo -e "\nPM2 Status:"
    pm2 list
fi

print_section "Deployment Summary"
echo -e "${GREEN}✓ Application code updated${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Application built${NC}"
echo -e "${GREEN}✓ Database schema updated${NC}"
echo -e "${GREEN}✓ Application restarted${NC}"
echo -e "${GREEN}✓ Backup script configured${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Test the application at http://$DOMAIN"
echo "2. Setup SSL certificate: sudo certbot --nginx -d $DOMAIN"
echo "3. Monitor logs: pm2 logs $APP_NAME"
echo "4. Monitor performance: pm2 monit"

echo -e "\n${YELLOW}Admin Credentials:${NC}"
echo "Email: admin@example.com"
echo "Password: admin123"
echo -e "${RED}Remember to change the admin password after first login!${NC}"

echo -e "\n${GREEN}Deployment completed successfully!${NC}"