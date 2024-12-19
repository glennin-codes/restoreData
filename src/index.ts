import { MongoClient } from "mongodb";
import path from "path";

// Path to the PEM file
const pemFilePath = path.resolve(__dirname, "../global_bundle.pem");
console.log("PEM file path:", pemFilePath);

// Connection URI
const uri = `mongodb://serenity:serenity@db-restoreserenity.cluster-cxbhfsiqrl4y.us-east-1.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=${pemFilePath}&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&directConnection=true`;

async function discoverDatabases() {
    console.log("\n=== Starting Detailed Database Discovery ===\n");
    const client = new MongoClient(uri, {
        connectTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,

    });

    try {
        await client.connect();
        console.log("✓ Successfully connected to DocumentDB cluster");

        // Method 1: Try admin commands
        console.log("\n=== Method 1: Administrative Commands ===");
        try {
            const adminDb = client.db('admin');
            console.log("Attempting to run admin commands...");
            
            // Try different commands that might reveal database info
            const commands = [
                { listDatabases: 1 },
                { dbStats: 1 },
                { serverStatus: 1 }
            ];

            for (const command of commands) {
                try {
                    const result = await adminDb.command(command);
                    console.log(`\nCommand ${Object.keys(command)[0]} result:`);
                    console.log(JSON.stringify(result, null, 2));
                } catch (cmdError:any) {
                    console.log(`Command ${Object.keys(command)[0]} failed:`, cmdError.message);
                }
            }
        } catch (adminError:any) {
            console.log("Admin commands failed:", adminError.message);
        }

        // Method 2: Try to access system collections
        console.log("\n=== Method 2: System Collections ===");
        const systemDbs = ['admin', 'local', 'config'];
        for (const dbName of systemDbs) {
            try {
                const db = client.db(dbName);
                const collections = await db.listCollections().toArray();
                console.log(`\nSystem database '${dbName}' collections:`, collections.map(c => c.name));
            } catch (sysError:any) {
                console.log(`Could not access system database '${dbName}':`, sysError.message);
            }
        }

        // Method 3: Attempt common database names
        console.log("\n=== Method 3: Common Database Names ===");
        const commonNames = [
            'serenity', 'admin'
        ];

        for (const dbName of commonNames) {
            try {
                console.log(`\nTrying database: ${dbName}`);
                const db = client.db(dbName);
                
                // Try to get database stats
                try {
                    const stats = await db.stats();
                    console.log(`Database '${dbName}' stats:`, stats);
                } catch (statsError) {
                    console.log(`Could not get stats for '${dbName}'`);
                }
                
                // List collections
                const collections = await db.listCollections().toArray();
                if (collections.length > 0) {
                    console.log(`Found collections in '${dbName}':`);
                    for (const collection of collections) {
                        console.log(`\nCollection: ${collection.name}`);
                        try {
                            const count = await db.collection(collection.name).countDocuments();
                            console.log(`- Document count: ${count}`);
                            
                            if (count > 0) {
                                const sample = await db.collection(collection.name)
                                    .find({})
                                    .limit(1)
                                    .toArray();
                                console.log("- Sample document structure:", Object.keys(sample[0]));
                            }
                        } catch (collError:any) {
                            console.log(`- Error accessing collection: ${collError.message}`);
                        }
                    }
                } else {
                    console.log(`No collections found in '${dbName}'`);
                }
            } catch (dbError:any) {
                console.log(`Error accessing '${dbName}':`, dbError.message);
            }
        }

        // Method 4: Check for active connections and operations
        console.log("\n=== Method 4: Active Operations ===");
        try {
            const adminDb = client.db('admin');
            const currentOp = await adminDb.command({ currentOp: 1 });
            console.log("Active operations:", currentOp);
        } catch (opError:any) {
            console.log("Could not check active operations:", opError.message);
        }

    } catch (error) {
        console.error("\nMain error during discovery:", error);
    } finally {
        await client.close();
        console.log("\n=== Database Discovery Complete ===");
    }
}

discoverDatabases().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});