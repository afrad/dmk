#!/bin/bash

# Friday Prayer Registration System - Local Development Setup Script
# Run this script to quickly set up the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Friday Prayer Registration System - Development Setup${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_section "Checking prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js: $NODE_VERSION"

    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}Node.js 18+ required. Current version: $NODE_VERSION${NC}"
        echo "Please update Node.js: https://nodejs.org/"
        exit 1
    fi
else
    echo -e "${RED}Node.js not found. Please install Node.js 18+${NC}"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm: $NPM_VERSION"
else
    echo -e "${RED}npm not found${NC}"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    PG_VERSION=$(psql --version | cut -d' ' -f3)
    echo "✓ PostgreSQL: $PG_VERSION"
    POSTGRES_AVAILABLE=true
else
    echo -e "${YELLOW}PostgreSQL not found.${NC}"
    echo "Please install PostgreSQL:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Windows: https://www.postgresql.org/download/windows/"

    read -p "Do you want to continue without PostgreSQL? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    POSTGRES_AVAILABLE=false
fi

print_section "Installing dependencies"
npm install

print_section "Setting up environment"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created .env file from .env.example"
    echo -e "${YELLOW}Please review and update .env file with your configuration${NC}"
else
    echo "✓ .env file already exists"
fi

if [ "$POSTGRES_AVAILABLE" = true ]; then
    print_section "PostgreSQL setup"
    echo "Setting up PostgreSQL database..."

    # Check if database exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw dmk; then
        echo "✓ Database 'dmk' already exists"
    else
        echo "Creating database 'dmk'..."
        sudo -u postgres psql << 'EOF'
CREATE DATABASE dmk;
CREATE USER dmk WITH PASSWORD 'dmk';
GRANT ALL PRIVILEGES ON DATABASE dmk TO dmk;
\q
EOF
        echo "✓ Database 'dmk' created"
    fi

    print_section "Database operations"
    echo "Generating Prisma client..."
    npm run db:generate

    echo "Pushing database schema..."
    npm run db:push

    echo "Seeding database with test data..."
    npm run db:seed

else
    echo -e "${YELLOW}Skipping database setup - PostgreSQL not available${NC}"
    echo "You'll need to:"
    echo "1. Install PostgreSQL"
    echo "2. Create database and user as shown in README.md"
    echo "3. Run: npm run db:generate && npm run db:push && npm run db:seed"
fi

print_section "Development setup complete!"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Environment configured${NC}"

if [ "$POSTGRES_AVAILABLE" = true ]; then
    echo -e "${GREEN}✓ Database setup complete${NC}"
    echo -e "${GREEN}✓ Test data seeded${NC}"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review and update .env file if needed"
echo "2. Start the development server: npm run dev"
echo "3. Visit http://localhost:3001"

if [ "$POSTGRES_AVAILABLE" = true ]; then
    echo "4. Admin login: admin@example.com / admin123"
fi

echo -e "\n${YELLOW}Available commands:${NC}"
echo "npm run dev          # Start development server"
echo "npm run build        # Build for production"
echo "npm run db:seed      # Reseed database"
echo "npm run db:push      # Update database schema"

if [ "$POSTGRES_AVAILABLE" = false ]; then
    echo -e "\n${RED}Remember to set up PostgreSQL and run database commands!${NC}"
fi

echo -e "\n${GREEN}Happy coding! 🚀${NC}"