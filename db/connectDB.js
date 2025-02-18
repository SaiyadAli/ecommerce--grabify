const mongoose = require('mongoose');

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGO_URI||"mongodb://3.108.51.226:27017");

        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

// Export the connection function
module.exports = connectDB;
