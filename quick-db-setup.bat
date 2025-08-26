@echo off
echo Setting up local MongoDB for Next.js app...

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo MongoDB not found. Please install MongoDB Community Server:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

REM Create data directory if it doesn't exist
if not exist "C:\data\db" (
    echo Creating MongoDB data directory...
    mkdir "C:\data\db"
)

REM Start MongoDB service
echo Starting MongoDB...
net start MongoDB 2>nul
if %errorlevel% neq 0 (
    echo Starting MongoDB manually...
    start /min mongod --dbpath "C:\data\db"
    timeout /t 3 >nul
)

REM Create .env.local file
echo Creating .env.local file...
echo MONGODB_URI=mongodb://localhost:27017/nextjs-dashboard > .env.local

echo.
echo ✅ Setup complete!
echo ✅ MongoDB is running locally
echo ✅ .env.local configured for local database
echo.
echo You can now restart your Next.js app with: npm run dev
pause
