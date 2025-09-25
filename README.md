# Friday Prayer Registration System

A lightweight web application for managing Friday prayer registrations with multi-language support, QR code generation, and real-time capacity management.

## Features

- **Multi-language Support**: English, German, French, Arabic (with RTL support)
- **Real-time Registration**: Automatic registration windows from Saturday 00:00 to prayer time
- **QR Code Generation**: Offline-capable QR codes for attendance verification
- **Admin Dashboard**: Prayer management, capacity monitoring, CSV exports
- **Device-based Registration**: One registration per device per prayer
- **Companion Management**: Add up to 4 companions per registration
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based admin authentication
- **Styling**: Custom CSS
- **Internationalization**: next-intl
- **QR Generation**: qrcode library

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Git

### Quick Setup

```bash
# Clone the repository
git clone <repository-url>
cd dmk

# Run automated setup script
chmod +x setup-dev.sh
./setup-dev.sh

# Start development server
npm run dev
```

### Manual Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Database Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE dmk;
CREATE USER dmk WITH PASSWORD 'dmk';
GRANT ALL PRIVILEGES ON DATABASE dmk TO dmk;
\q
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

#### 4. Database Setup
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Create database schema
npm run db:seed      # Add test data
```

#### 5. Start Development
```bash
npm run dev
```

Access at `http://localhost:3001`

### Admin Access
- **Admin Panel**: `http://localhost:3001/admin`
- Use credentials configured during database seeding

---

## Production Deployment (Ubuntu Server)

### Prerequisites

- Ubuntu 20.04+ server with root access
- Domain name pointed to your server
- At least 1GB RAM and 10GB storage

### Automated Deployment

```bash
# On your Ubuntu server, create application user
sudo adduser dmk
sudo usermod -aG sudo dmk
sudo su - dmk

# Clone repository
git clone <repository-url>
cd dmk

# Run automated deployment script
chmod +x deploy.sh
./deploy.sh
```

The script will automatically:
- Install Node.js, PM2, Nginx, and PostgreSQL
- Set up the database
- Build and start the application
- Configure reverse proxy
- Set up automated backups
- Configure firewall

### Manual Deployment Steps

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

#### 2. Create Application User
```bash
# Create dedicated user
sudo adduser dmk
sudo usermod -aG sudo dmk
sudo su - dmk
```

#### 3. Clone and Build Application
```bash
# Clone repository
git clone <repository-url>
cd dmk

# Install dependencies
npm ci --only=production

# Build application
npm run build
```

#### 4. Database Setup (Production)
```bash
# Create production database
sudo -u postgres psql
CREATE DATABASE dmk_prod;
CREATE USER dmk_prod WITH PASSWORD 'SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE dmk_prod TO dmk_prod;
\q
```

Create production `.env`:
```env
# Database
DATABASE_URL="postgresql://dmk_prod:SECURE_PASSWORD_HERE@localhost:5432/dmk_prod"

# Authentication
NEXTAUTH_SECRET="super-strong-secret-64-chars-long-change-this-in-production"
NEXTAUTH_URL="https://yourdomain.com"

# Environment
NODE_ENV="production"
PORT=3001
```

```bash
# Setup database
npm run db:push
npm run db:seed
```

#### 5. PM2 Process Manager
```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

#### 6. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/friday-prayer
```

Add this configuration (replace `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be updated after getting certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:3001;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/friday-prayer /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 7. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 8. Firewall Setup
```bash
# Configure firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

#### 9. Automated Backups
The deployment script creates a backup script at `/home/dmk/backup-db.sh` that runs daily at 2 AM via cron job.

Manual backup:
```bash
# Create backup
pg_dump -U dmk_prod -h localhost dmk_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U dmk_prod -h localhost dmk_prod < backup_20241201.sql
```

---

## Application Management

### PM2 Commands
```bash
pm2 list                    # List all processes
pm2 logs friday-prayer-app  # View logs
pm2 restart friday-prayer-app  # Restart application
pm2 stop friday-prayer-app  # Stop application
pm2 monit                   # Monitor resources
```

### Application Updates
```bash
cd /home/dmk/dmk
git pull
npm ci --only=production
npm run build
pm2 restart friday-prayer-app
```

### Database Management
```bash
npm run db:push    # Update schema
npm run db:seed    # Reseed data
```

---

## API Endpoints

### Public APIs
- `GET /api/prayers` - List upcoming prayers
- `POST /api/registrations` - Create registration
- `PATCH /api/registrations/[id]` - Update registration
- `DELETE /api/registrations/[id]` - Cancel registration

### Admin APIs (Authentication Required)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/prayers` - List prayers with stats
- `POST /api/admin/prayers` - Create prayer
- `PATCH /api/admin/prayers/[id]` - Update prayer
- `DELETE /api/admin/prayers/[id]` - Delete prayer
- `GET /api/admin/prayers/[id]/registrations` - List registrations
- `POST /api/admin/prayers/[id]/export` - Export CSV

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NEXTAUTH_SECRET` | JWT signing secret | Required |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3001` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |

### Registration Business Rules

- **Registration Window**: Saturday 00:00 (Europe/Berlin) to prayer start time
- **Capacity**: Hard limit enforced with database transactions
- **Device Limit**: One active registration per device per prayer
- **Companions**: Maximum 4 companions per registration
- **Auto-activation**: Prayers activate automatically during registration window
- **Manual Override**: Admin can manually activate/deactivate prayers

---

## Monitoring & Maintenance

### Health Checks
```bash
# Check application status
curl http://localhost:3001/api/prayers

# Check PM2 status
pm2 list

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Log Files
- **Application**: `pm2 logs friday-prayer-app`
- **Nginx Access**: `/var/log/nginx/access.log`
- **Nginx Error**: `/var/log/nginx/error.log`
- **PostgreSQL**: `/var/log/postgresql/postgresql-*.log`

### Performance Monitoring
```bash
# Monitor system resources
htop

# Monitor application performance
pm2 monit

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## Troubleshooting

### Common Issues

**Application Won't Start**
```bash
# Check logs
pm2 logs friday-prayer-app

# Check environment variables
cat .env

# Verify database connection
npm run db:push
```

**Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U dmk_prod -d dmk_prod -h localhost

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Nginx Issues**
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

**SSL Certificate Problems**
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Security Best Practices

1. **Change Default Passwords**: Update admin password immediately
2. **Secure Database**: Use strong database passwords
3. **Environment Variables**: Never commit `.env` files
4. **SSL Certificate**: Always use HTTPS in production
5. **Firewall**: Only open necessary ports
6. **Updates**: Keep system and dependencies updated
7. **Backups**: Automated daily database backups
8. **Monitoring**: Set up uptime monitoring

---

## Package Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with test data
```

---

## Support

### Getting Help
1. Check this documentation
2. Review application logs: `pm2 logs friday-prayer-app`
3. Check system logs: `journalctl -u nginx` or `journalctl -u postgresql`
4. Verify configuration files
5. Contact system administrator

### Useful Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)

---

**Built with ❤️ for the community**