// filepath: c:\Users\blazh\Paketnik1\Paketnik\RAZVOJ-APLIKACIJ-ZA-INTERNET\backend\generate-fake-logs.js
const mongoose = require('mongoose');
const Box = require('./models/boxModel');
const User = require('./models/userModel');
const UnlockEvent = require('./models/unlockEventModel');

// MongoDB connection string - replace with your actual connection string if different
const mongoDB = "mongodb+srv://blazhercog:JkYorfWgUfYUp9Vd@cluster0.v3maz6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const unlockMethods = ['password', 'facial', 'mobile'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateFakeUnlockLogs(numberOfLogs = 50) {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoDB);
        console.log('Connected successfully to MongoDB.');

        const boxes = await Box.find().limit(10); // Get up to 10 boxes
        const users = await User.find().limit(10); // Get up to 10 users

        if (boxes.length === 0) {
            console.log('No boxes found. Please add some boxes first.');
            return;
        }
        if (users.length === 0) {
            console.log('No users found. Please add some users first.');
            return;
        }

        console.log(`Found ${boxes.length} boxes and ${users.length} users to generate logs for.`);

        const fakeLogs = [];
        const startDate = new Date(2025, 4, 15); // Start date for logs (May 15, 2025)
        const endDate = new Date(); // End date for logs (today)

        for (let i = 0; i < numberOfLogs; i++) {
            const randomBox = getRandomElement(boxes);
            const randomUser = getRandomElement(users);
            const randomMethod = getRandomElement(unlockMethods);
            const randomTimestamp = getRandomDate(startDate, endDate);
            const randomSuccess = Math.random() < 0.9; // 90% success rate

            const logEntry = {
                box: randomBox._id,
                user: randomUser._id,
                unlockMethod: randomMethod,
                timestamp: randomTimestamp,
                success: randomSuccess,
            };
            fakeLogs.push(logEntry);
        }

        if (fakeLogs.length > 0) {
            console.log(`Attempting to insert ${fakeLogs.length} fake logs...`);
            const result = await UnlockEvent.insertMany(fakeLogs);
            console.log(`Successfully inserted ${result.length} fake unlock logs.`);
        } else {
            console.log('No fake logs were generated to insert.');
        }

    } catch (error) {
        console.error('Error generating fake unlock logs:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

// Run the script
const numberOfLogsToGenerate = parseInt(process.argv[2]) || 50; // Get number of logs from command line or default to 50
console.log(`Starting to generate ${numberOfLogsToGenerate} fake unlock logs...`);
generateFakeUnlockLogs(numberOfLogsToGenerate).then(() => {
    console.log('Fake log generation process completed.');
}).catch(err => {
    console.error('Failed to run fake log generation script:', err);
    process.exit(1);
});
