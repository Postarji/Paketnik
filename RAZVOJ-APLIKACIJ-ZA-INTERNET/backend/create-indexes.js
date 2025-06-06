const mongoose = require('mongoose');
const User = require('./models/userModel');

// MongoDB connection string - same as in app.js
const mongoDB = "mongodb+srv://blazhercog:JkYorfWgUfYUp9Vd@cluster0.v3maz6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function createIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoDB);
        console.log('Connected to MongoDB');

        // Create unique indexes
        await User.collection.createIndex({ username: 1 }, { unique: true });
        console.log('Created unique index on username');
        
        await User.collection.createIndex({ email: 1 }, { unique: true });
        console.log('Created unique index on email');

        console.log('\nIndexes created successfully!');
        console.log('Now duplicate usernames and emails will be prevented.');
        
    } catch (error) {
        console.error('Error creating indexes:', error);
        if (error.code === 11000) {
            console.error('\nDuplicate values found! You need to resolve duplicate usernames/emails before creating unique indexes.');
            console.error('Check your database for duplicate values and remove them manually.');
        }
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the script
createIndexes();