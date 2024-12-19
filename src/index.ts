import { MongoClient } from "mongodb";
import path from "path";

// Path to the PEM file
const pemFilePath = path.resolve(__dirname, "../global_bundle.pem");
console.log("PEM file path:", pemFilePath);

// Connection URI
const uri = `mongodb://serenity:serenity@db-restoreserenity.cluster-cxbhfsiqrl4y.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=${pemFilePath}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&directConnection=true`;

async function listDatabasesAndCollections() {
  console.log("function running ..");
  const client = new MongoClient(uri, {
    connectTimeoutMS: 60000,
    // Add these options for better error handling and compatibility
    serverSelectionTimeoutMS: 60000,
  
  });

  try {
    // Connect to the cluster
    await client.connect();
    console.log("Connected to DocumentDB!");

    // List databases
    const adminDb = client.db().admin();
    const result = await adminDb.listDatabases();
    
    if (!result || !result.databases) {
      console.log("No databases found or unauthorized access");
      return;
    }

    console.log("\nDatabases:");
    console.log(JSON.stringify(result.databases, null, 2));

    // For each database, list its collections
    for (const db of result.databases) {
      try {
        console.log(`\nCollections in database "${db.name}":`);
        const database = client.db(db.name);
        const collections = await database.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log(`- No collections found in ${db.name}`);
        } else {
          collections.forEach(collection => 
            console.log(`- ${collection.name}`)
          );
        }
      } catch (dbError:any) {
        console.error(`Error accessing database ${db.name}:`, dbError.message);
      }
    }
  } catch (error:any) {
    console.error("Error connecting or listing databases:", error);
    // Log more detailed error information
    if (error.code) console.error("Error code:", error.code);
    if (error.codeName) console.error("Error codeName:", error.codeName);
  } finally {
    try {
      await client.close();
      console.log("Connection closed.");
    } catch (closeError) {
      console.error("Error while closing connection:", closeError);
    }
  }
}

// Add error handling for the main function call
listDatabasesAndCollections().catch(error => {
  console.error("Top-level error:", error);
  process.exit(1);
});