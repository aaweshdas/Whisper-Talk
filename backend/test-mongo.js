const mongoose = require('mongoose');

async function testConnection() {
  const uri = "mongodb+srv://aaravdas288_db_user:acyhoW8LaI0378fM@cluster0.boabmp5.mongodb.net/whisper?appName=Cluster0";
  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();
