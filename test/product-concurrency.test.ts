import pool from "../src/config/database"; 
import { ProductRepository } from "../src/modules/products/repositories/product.repository";

const repo = new ProductRepository();

async function runExactTenRequestsTest() {
  console.log("🚀 Starting Real Test: 10 Adds and 10 Deletes at the exact same time...");

  const tasks: Promise<any>[] = [];
  const startTime = Date.now();

  for (let i = 1; i <= 10; i++) {
    
    // ១. ផ្នែក Add ផលិតផលថ្មី
    const addQuery = repo.create({
      name: `Real-time Product ${i}`,
      price: 1.50 + i,
      stock: 100 + i,
      barcode: `REAL-${Date.now()}-${i}`, 
      unit: "PCS",
      category: "Drinks"
    }, 1);
    tasks.push(addQuery);

    // 🛠️ ២. ផ្នែកលុប (កែប្រែត្រង់នេះដើម្បីឱ្យចាប់យកម៉ោងកុំព្យូទ័រស្រុកខ្មែរចំៗ)
    const localStatusDate = new Date();
    const tzOffset = localStatusDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(localStatusDate.getTime() - tzOffset).toISOString().slice(0, -1);

    // // 🌟 ចាំប្ដូរ ID "43" ទៅជាលេខ ID ណាដែលមានពិតប្រាកដក្នុង phpMyAdmin របស់ប្អូន
    // const deleteQuery = repo.update("43" , {
    //   deletedAt: localISOTime
    // });
    // tasks.push(deleteQuery);

    for (let id = 43; id <= 48; id++) {
      const deleteQuery = repo.update(id.toString(), {
        deletedAt: localISOTime
      });
      tasks.push(deleteQuery);
    }
  }

  try {
    await Promise.all(tasks)
    console.log(`⏳ Despatching all 20 actions (10 Adds + 10 Deletes) to Connection Pool...`);
    
    const results = await Promise.all(tasks);
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ [REAL TEST SUCCESSFUL]`);
    console.log(`- Total Actions Handled: ${results.length} (10 Adds & 10 Deletes)`);
    console.log(`- Total Time Taken: ${duration.toFixed(3)} seconds`);

  } catch (error) {
    console.error("❌ Test Failed with error:", error);
  } finally {
    console.log("🔌 Closing database connection pool...");
    await pool.end();
    console.log("👋 Test process finished.");
  }
}

runExactTenRequestsTest();