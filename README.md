# Football Picks App

A complete football picks application with React frontend and Node.js backend.

## Features

- User authentication (login/register)
- Make picks for NFL games
- View weekly and overall standings
- Team statistics
- Responsive design with glass morphism UI

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Setup Instructions for Windows

### 1. Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version for Windows
3. Run the installer and follow the setup wizard
4. Open Command Prompt or PowerShell and verify installation:
   ```
   node --version
   npm --version
   ```

### 2. Download and Setup the Project

1. Download/clone this project to your computer
2. Open Command Prompt or PowerShell
3. Navigate to the project folder:
   ```
   cd path\to\football-picks-app
   ```

### 3. Setup the Backend

1. Navigate to the backend folder:
   ```
   cd backend
   ```

2. Install backend dependencies:
   ```
   npm install
   ```

3. Initialize the database:
   ```
   npm run init-db
   ```

4. Seed the database with sample data:
   ```
   npm run seed-db
   ```

5. Start the backend server:
   ```
   npm run dev
   ```

   You should see: "Server running on port 3001"

### 4. Setup the Frontend (New Command Prompt/PowerShell Window)

1. Open a NEW Command Prompt or PowerShell window
2. Navigate to the frontend folder:
   ```
   cd path\to\football-picks-app\football-picks-app
   ```

3. Install frontend dependencies:
   ```
   npm install
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

   You should see: "Local: http://localhost:5173"

### 5. Access the Application

1. Open your web browser
2. Go to: `http://localhost:5173`
3. You can now use the application!

## Test Accounts

The database comes with these test accounts:

- **Email:** `test@test.com` **Password:** `password`
- **Email:** `joe` **Password:** `password`

Or create a new account using site password: `cowboys`

## How to Use

1. **Login** with one of the test accounts or create a new one
2. **Make Picks** - Select winners and assign point values (1-16 for each game)
3. **View Standings** - See weekly and overall rankings
4. **Team Stats** - View statistics about team performance

## Project Structure

```
football-picks-app/
├── backend/                 # Node.js/Express backend
│   ├── server.js           # Main server file
│   ├── scripts/            # Database setup scripts
│   └── package.json        # Backend dependencies
├── football-picks-app/     # React frontend
│   ├── src/                # React source code
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
├── images/                 # Team logos
└── README.md              # This file
```

## Database

- Uses SQLite database (`database.sqlite`)
- Automatically created when you run `npm run init-db`
- Contains tables for users, teams, games, picks, etc.

## Stopping the Application

- Press `Ctrl+C` in both Command Prompt windows to stop the servers
- The database file will persist, so your data is saved

## Troubleshooting

### "Port already in use" error
- Make sure no other applications are using ports 3001 or 5173
- Or change the ports in the configuration files

### "Cannot connect to backend" error
- Make sure the backend server is running on port 3001
- Check that both servers are running in separate command windows

### Database errors
- Delete `database.sqlite` file and run the init/seed commands again

## Development

- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:5173`
- Database file: `backend/database.sqlite`
- Team images are served from `/images/` folder

## Next Steps

Once you have this working locally, you can:
1. Modify the database schema as needed
2. Add more features
3. Deploy to a hosting service
4. Migrate data from your existing PHP application