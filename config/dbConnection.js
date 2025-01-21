const mongoose = require('mongoose');
require('dotenv').config();

const dbConnection = async () => {
    try {
        const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Hospital';
        await mongoose.connect(dbURI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = dbConnection;
