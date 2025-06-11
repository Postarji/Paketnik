const mongoose = require('mongoose');
const Box = require('./models/boxModel');

// MongoDB connection string - same as in app.js
const mongoDB = "mongodb+srv://blazhercog:JkYorfWgUfYUp9Vd@cluster0.v3maz6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrateBoxes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoDB);
        console.log('Connected successfully');

        // Update all existing boxes to have the new fields
        const result = await Box.updateMany(
            {}, // Empty filter = all documents
            {
                $set: {
                    status: 'available',
                    capacity: 5,
                    currentBooks: []
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} boxes with new fields`);

        // Verify the migration
        const boxes = await Box.find({});
        console.log(`Total boxes in database: ${boxes.length}`);
        
        boxes.forEach(box => {
            console.log(`Box "${box.name}": status=${box.status}, capacity=${box.capacity}, currentBooks=${box.currentBooks?.length || 0}`);
        });

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the migration
console.log('Starting box migration...');
migrateBoxes();
