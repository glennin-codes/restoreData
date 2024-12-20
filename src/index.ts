import { MongoClient } from "mongodb";
import path from "path";

// Path to the PEM file
const pemFilePath = path.resolve(__dirname, "../global_bundle.pem");

// Connection URI
const uri = `mongodb://serenity:serenity@db-restoreserenity.cluster-cxbhfsiqrl4y.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=${pemFilePath}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&directConnection=true`;

// Add your schema collection names here
const expectedCollections = [
    // Example: if your schema has models like User, Product, etc.
    // add them here exactly as they appear in your schema
    'User',
    'TaskReminder',
    'Subtitle',
    'Report',
    'Reading',
    'Question',
    'Promo',
    'Post',
    'Podcast',
    "Notification",
    "Message",
    'Meeting',
    "Inventory",
    'Gratitude',
    'FriendInNeed',
    'Conversation',
    'Comment',
    "Chat",
   'Block',
   'AppVersion'


    // Add more collection names from your schema
];

async function checkSchemaCollections() {
    console.log("Starting schema-based database check...");
    const client = new MongoClient(uri, {
        connectTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
       
    });

    try {
        await client.connect();
        console.log("Connected to DocumentDB!");

        // Try each collection name
        for (const collectionName of expectedCollections) {
            console.log(`\nChecking collection: ${collectionName}`);
            
            try {
                // Try common database names with this collection
                const dbsToTry = ['serenity', 'main', 'test', 'admin'];
                
                for (const dbName of dbsToTry) {
                    console.log(`\nTrying database '${dbName}' for collection '${collectionName}'`);
                    const db = client.db(dbName);
                    
                    try {
                        const collection = db.collection(collectionName);
                        const count = await collection.countDocuments();
                        console.log(`Found collection! Document count: ${count}`);
                        
                        if (count > 0) {
                            // Try to get a sample document
                            const sample = await collection.findOne({});
                            console.log("Sample document structure:", sample);
                            console.log("SUCCESS: Found data in", dbName, collectionName);
                            return { database: dbName, collection: collectionName, sample };
                        }
                    } catch (collError:any) {
                        console.log(`Error checking collection in ${dbName}:`, collError.message);
                    }
                }
            } catch (error:any) {
                console.log(`Error checking collection ${collectionName}:`, error.message);
            }
        }
    } catch (error) {
        console.error("Main error:", error);
    } finally {
        await client.close();
        console.log("\nDatabase check complete");
    }
}

// You can also provide the exact database name if you know it
async function checkSpecificDatabase(dbName: string | undefined, collections: any) {
    const client = new MongoClient(uri, {
        connectTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
       
    });

    try {
        await client.connect();
        console.log(`Checking specific database: ${dbName}`);
        
        const db = client.db(dbName);
        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                console.log(`${collectionName}: ${count} documents`);
                
                if (count > 0) {
                    const sample = await collection.findOne({});
                    console.log(`Sample from ${collectionName}:`, sample);
                }
            } catch (error:any) {
                console.log(`Error with collection ${collectionName}:`, error.message);
            }
        }
    } finally {
        await client.close();
    }
}

// Run the checks
checkSchemaCollections();

// If you know the exact database name, uncomment and use this:
// checkSpecificDatabase('your_database_name', expectedCollections);