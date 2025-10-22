# Football Picks Application

A modern web application for NFL football picks competition built with React and Node.js. Users can make weekly picks, view standings, and compete with friends in a beautiful, responsive interface.

## Features

- **User Authentication**: Secure login and account creation
- **Weekly Picks**: Make picks for NFL games with confidence values
- **Standings**: View weekly and overall standings with detailed statistics
- **Team Statistics**: Track team performance and pick accuracy
- **Admin Panel**: Manage users, run update scripts, and assign tags
- **Progressive Web App**: Installable on mobile devices
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live score updates and standings

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons
- **CSS3** - Custom glass-morphism design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Express Session** - Session management
- **CORS** - Cross-origin resource sharing
- **PHP** - Legacy update scripts

## Author

**Joe M.** - Full Stack Developer
- Created the modern React frontend
- Developed the Node.js backend API
- Implemented responsive design and PWA features
- Built the admin panel and user management system

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **PHP** (for update scripts)
- **Git**

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd React\ Football\ Picks
```

### 2. Database Setup

1. **Install PostgreSQL** on your system
2. **Create a database**:
   ```sql
   CREATE DATABASE football;
   CREATE USER footballusr WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE football TO footballusr;
   ```

3. **Import the database schema** (if you have a SQL dump file):
   ```bash
   psql -U footballusr -d football -f database_schema.sql
   ```

### 3. Backend Setup

```bash
cd backend
npm install
```

**Configure the database connection** in `backend/config/app.js`:
```javascript
database: {
  user: 'footballusr',
  host: 'localhost',
  database: 'football',
  password: 'password',
  port: 5432
}
```

**Start the backend server**:
```bash
npm start
# or for development
npm run dev
```

The backend will run on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd football-picks-app
npm install
```

**Start the development server**:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 5. Access the Application

- Open your browser and navigate to `http://localhost:5173`
- The frontend will automatically connect to the backend API
- Create an account or login to start using the application

## Linux Server Deployment

### 1. Server Requirements

- **Ubuntu 20.04+** or **CentOS 7+**
- **Node.js 18+**
- **PostgreSQL 12+**
- **Nginx** (for reverse proxy)
- **PM2** (for process management)
- **PHP 7.4+** (for update scripts)

### 2. Install Dependencies

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PHP
sudo apt install php php-cli php-fpm php-pgsql

# Install Nginx
sudo apt install nginx

# Install PM2 globally
sudo npm install -g pm2
```

#### CentOS/RHEL:
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Install PHP
sudo yum install php php-cli php-fpm php-pgsql

# Install Nginx
sudo yum install nginx

# Install PM2 globally
sudo npm install -g pm2
```

### 3. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE football;
CREATE USER footballusr WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE football TO footballusr;
\q
```

### 4. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd React\ Football\ Picks

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../football-picks-app
npm install
npm run build
```

### 5. Configure Backend

Edit `backend/config/app.js`:
```javascript
database: {
  user: 'footballusr',
  host: 'localhost',
  database: 'football',
  password: 'your_secure_password',
  port: 5432
}
```

### 6. Configure Nginx

Create `/etc/nginx/sites-available/football-picks`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/React\ Football\ Picks/football-picks-app/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static images
    location /images {
        root /path/to/React\ Football\ Picks/football-picks-app/dist;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/football-picks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Start Services with PM2

Create `ecosystem.config.js` in the project root:
```javascript
module.exports = {
  apps: [{
    name: 'football-picks-backend',
    script: 'backend/server.js',
    cwd: '/path/to/React Football Picks',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=production
PORT=3001
DB_USER=footballusr
DB_HOST=localhost
DB_NAME=football
DB_PASSWORD=your_secure_password
DB_PORT=5432
SESSION_SECRET=your_session_secret_key
```

## Admin Features

The application includes an admin panel accessible to users with admin privileges:

- **User Management**: View and manage all users
- **Picks Management**: View and edit user picks
- **Update Scripts**: Run database update scripts
- **Tag Management**: Assign tags to users for filtering

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/create-account` - Create new account
- `GET /api/check-session` - Check authentication status

### Games & Picks
- `GET /api/weeks` - Get available weeks
- `GET /api/games/:weekId` - Get games for a week
- `GET /api/picks/:weekId` - Get user picks for a week
- `POST /api/picks/:weekId` - Submit picks for a week

### Standings
- `GET /api/overall-standings` - Get overall standings
- `GET /api/weekly-standings/:weekId` - Get weekly standings
- `GET /api/team-stats` - Get team statistics

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/picks-status/:weekId` - Get picks status
- `POST /api/admin/run-script` - Run update scripts

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify database credentials in `backend/config/app.js`
   - Ensure database exists and user has proper permissions

2. **Frontend Not Loading**:
   - Check if backend is running on port 3001
   - Verify CORS settings in backend configuration
   - Check browser console for errors

3. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Permission Issues**:
   - Ensure proper file permissions: `chmod -R 755 /path/to/app`
   - Check PM2 process ownership: `pm2 logs`

### Logs

- **PM2 Logs**: `pm2 logs football-picks-backend`
- **Nginx Logs**: `sudo tail -f /var/log/nginx/error.log`
- **PostgreSQL Logs**: `sudo tail -f /var/log/postgresql/postgresql-*.log`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the developer or create an issue in the repository.
