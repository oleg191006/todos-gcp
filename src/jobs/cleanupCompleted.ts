import { Firestore } from "@google-cloud/firestore";

const limit = Number(process.env.CLEANUP_LIMIT ?? 100);

async function run(): Promise<void> {
  const db = new Firestore();
  const snapshot = await db
    .collection("todos")
    .where("completed", "==", true)
    .limit(limit)
    .get();

  if (snapshot.empty) {
    console.log("cleanup: nothing to delete");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`cleanup: deleted ${snapshot.size} completed todos`);
}

run().catch((error) => {
  console.error("cleanup: failed", error);
  process.exitCode = 1;
});
