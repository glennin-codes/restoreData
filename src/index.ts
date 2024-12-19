import { MongoClient } from "mongodb";
import path from "path";

// Path to the PEM file
const pemFilePath = path.resolve(__dirname, "../global_bundle.pem");
console.log("PEM file path:", pemFilePath);

// Connection URI
const uri = `mongodb://serenity:serenity@db-restoreserenity.cluster-cxbhfsiqrl4y.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=${pemFilePath}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&directConnection=true`;

async function accessDatabase() {
  console.log("Function running...");
  const client = new MongoClient(uri, {
    connectTimeoutMS: 60000,
    serverSelectionTimeoutMS: 60000,
 
  });

  try {
    await client.connect();
    console.log("Connected to DocumentDB!");

    // Try to access a specific database - replace 'your_database_name' with your actual database name
    const dbName = 'serenity'; // <-- Change this to your database name
    const db = client.db(dbName);
    
    console.log(`\nAttempting to access database: ${dbName}`);
    
    // List collections in this specific database
    const collections = await db.listCollections().toArray();
    console.log('\nCollections found:');
    if (collections.length === 0) {
      console.log('No collections found or no access to view collections');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
        // Optionally, try to count documents in each collection
        db.collection(collection.name).countDocuments()
          .then(count => console.log(`  Documents in ${collection.name}: ${count}`))
          .catch(err => console.log(`  Unable to count documents in ${collection.name}: ${err.message}`));
      });
    }

    // Try to get build info to check permissions
    try {
      const buildInfo = await db.command({ buildInfo: 1 });
      console.log('\nBuild Info:', buildInfo);
    } catch (buildInfoError:any) {
      console.log('\nUnable to get build info:', buildInfoError.message);
    }

  } catch (error:any) {
    console.error("Error accessing database:", error);
    if (error.codeName) console.error("Error code name:", error.codeName);
    if (error.message) console.error("Error message:", error.message);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

accessDatabase().catch(error => {
  console.error("Top-level error:", error);
  process.exit(1);
});