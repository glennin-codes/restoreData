import { MongoClient } from "mongodb";
import path from "path";

// Path to the PEM file
const pemFilePath = path.resolve(__dirname, "../global_bundle.pem");
console.log("PEM file path:", pemFilePath);

// Connection URI
const uri = `mongodb://serenity:serenity@db-restoreserenity.cluster-cxbhfsiqrl4y.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=${pemFilePath}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&directConnection=true`;

async function listDatabasesAndCollections() {
  console.log("function running ..")
  const client = new MongoClient(uri, { connectTimeoutMS: 60000 });

  try {
    // Connect to the cluster
    await client.connect();
    console.log("Connected to DocumentDB!");

    // List databases
    const databases = await client.db().admin().listDatabases();
    console.log("Databases:");
    databases.databases.forEach((db) => console.log(`- ${db.name}`));

    // For each database, list its collections
    for (const db of databases.databases) {
      console.log(`\nCollections in database "${db.name}":`);
      const collections = await client.db(db.name).listCollections().toArray();
      collections.forEach((collection) =>
        console.log(`- ${collection.name}`)
      );
    }
  } catch (error) {
    console.error("Error listing databases or collections:", error);
  } finally {
    // Close the connection
    await client.close();
    console.log("Connection closed.");
  }
}

listDatabasesAndCollections();
