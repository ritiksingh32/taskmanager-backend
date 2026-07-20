require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

async function test() {
  try {
    const client = new MongoClient(uri);

    await client.connect();

    console.log("✅ Connected successfully");

    await client.db("admin").command({ ping: 1 });

    console.log("✅ Ping successful");

    await client.close();
  } catch (err) {
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error(err);
  }
}

test();