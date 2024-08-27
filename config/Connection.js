const mongoose = require("mongoose");

const Connection = async () => {
    try {
        // Check if a connection is already established
        if (mongoose.connection.readyState === 1) {  // 1 means connected
            console.log("Already connected to the database.");
            return mongoose.connection;
        }
        
        // If not connected, establish a new connection
        const connection = await mongoose.connect(process.env.CONNECTION_STRING);
        console.log("Database Connected.");
        return connection;
    } catch (error) {
        console.log("Error connecting to the database:", error);
    }
};

module.exports = Connection;
