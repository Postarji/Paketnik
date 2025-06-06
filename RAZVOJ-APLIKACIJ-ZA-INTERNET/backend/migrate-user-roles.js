const mongoose = require('mongoose');
const User = require('./models/userModel');

// MongoDB connection string - same as in app.js
const mongoDB = "mongodb+srv://blazhercog:JkYorfWgUfYUp9Vd@cluster0.v3maz6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrateUserRoles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoDB);
        console.log('Connected to MongoDB');

        // Find all users without a role
        const usersWithoutRole = await User.find({ role: { $exists: false } });
        console.log(`Found ${usersWithoutRole.length} users without a role`);

        // Update each user to have 'user' role
        for (const user of usersWithoutRole) {
            // Use updateOne to avoid triggering the save middleware
            await User.updateOne(
                { _id: user._id },
                { $set: { role: 'user' } }
            );
            console.log(`Updated user ${user.username} with role 'user'`);
        }

        console.log('Migration completed successfully');
        console.log('\nTo make a user an admin, manually update their role in MongoDB Atlas:');
        console.log('1. Go to your MongoDB Atlas dashboard');
        console.log('2. Browse Collections > users');
        console.log('3. Find the user you want to make admin');
        console.log('4. Edit the document and change role from "user" to "admin"');
        
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the migration
migrateUserRoles();