const mongoose = require('mongoose');
const Box = require('./models/boxModel');
const Photo = require('./models/photoModel');

// MongoDB connection string
const mongoDB = "mongodb+srv://blazhercog:JkYorfWgUfYUp9Vd@cluster0.v3maz6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testAddBooksToBox() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoDB);
        console.log('Connected successfully');

        // Find the first box and first few photos
        const box = await Box.findOne({});
        const photos = await Photo.find({}).limit(2);

        if (!box) {
            console.log('No boxes found');
            return;
        }

        if (photos.length === 0) {
            console.log('No photos found');
            return;
        }

        console.log(`Found box: ${box.name}`);
        console.log(`Found ${photos.length} photos`);
        
        photos.forEach(photo => {
            console.log(`Photo: ${photo.name} (ID: ${photo._id})`);
        });

        // Add books to the box for testing
        const booksToAdd = photos.map(photo => ({
            postId: photo._id,
            addedAt: new Date()
        }));

        box.currentBooks = box.currentBooks || [];
        box.currentBooks.push(...booksToAdd);
        
        // Update status if needed
        if (box.currentBooks.length >= box.capacity) {
            box.status = 'occupied';
        }

        await box.save();
        console.log(`Added ${booksToAdd.length} books to box "${box.name}"`);

        // Verify by fetching the box with populated data
        const updatedBox = await Box.findById(box._id)
            .populate('currentBooks.postId', 'name message path postedBy')
            .populate('owner', 'username')
            .exec();

        console.log('\nBox after update:');
        console.log(`Name: ${updatedBox.name}`);
        console.log(`Status: ${updatedBox.status}`);
        console.log(`Current books count: ${updatedBox.currentBooks.length}`);
        
        if (updatedBox.currentBooks.length > 0) {
            console.log('Books in box:');
            updatedBox.currentBooks.forEach((book, index) => {
                console.log(`  ${index + 1}. ${book.postId?.name || 'Unknown Book'} (Added: ${book.addedAt})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the test
console.log('Starting test...');
testAddBooksToBox().then(() => {
    console.log('Test completed');
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
