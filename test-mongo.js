const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = "mongodb+srv://aaravdas288_db_user:acyhoW8LaI0378fM@cluster0.boabmp5.mongodb.net/whisper?appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected successfully!");
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();
