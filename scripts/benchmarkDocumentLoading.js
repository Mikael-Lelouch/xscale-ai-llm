/**
 * Benchmark script to test lazy loading performance
 *
 * Usage:
 *   node scripts/benchmarkDocumentLoading.js --workspace-id=1 --doc-count=1000
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../server/utils/prisma");

async function createTestDocuments(workspaceId, count = 1000) {
  console.log(`\n📄 Creating ${count} test documents...`);

  const documents = [];
  for (let i = 0; i < count; i++) {
    documents.push({
      docId: uuidv4(),
      filename: `test-document-${String(i).padStart(6, "0")}.pdf`,
      docpath: `custom-documents/test-document-${i}.pdf`,
      workspaceId,
      metadata: JSON.stringify({
        title: `Test Document ${i}`,
        docAuthor: "Test Author",
        description: "Test document for benchmarking",
        docSource: "benchmark",
      }),
    });
  }

  try {
    const result = await prisma.workspace_documents.createMany({
      data: documents,
      skipDuplicates: true,
    });
    console.log(`✓ Created ${result.count} documents`);
    return result.count;
  } catch (error) {
    console.error("Error creating documents:", error.message);
    throw error;
  }
}

async function benchmarkPagination(workspaceId, pageSize = 50) {
  const { Document } = require("../server/models/documents");

  console.log(`\n⏱️  Benchmarking pagination (page size: ${pageSize})...`);

  const timings = {
    page1: [],
    page2: [],
    page5: [],
    page10: [],
  };

  const iterations = 5;

  // Test first page multiple times
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await Document.forWorkspacePaginated(workspaceId, 1, pageSize);
    const end = process.hrtime.bigint();
    timings.page1.push(Number(end - start) / 1000000); // Convert to ms
  }

  // Test page 2
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await Document.forWorkspacePaginated(workspaceId, 2, pageSize);
    const end = process.hrtime.bigint();
    timings.page2.push(Number(end - start) / 1000000);
  }

  // Test page 5
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await Document.forWorkspacePaginated(workspaceId, 5, pageSize);
    const end = process.hrtime.bigint();
    timings.page5.push(Number(end - start) / 1000000);
  }

  // Test page 10
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await Document.forWorkspacePaginated(workspaceId, 10, pageSize);
    const end = process.hrtime.bigint();
    timings.page10.push(Number(end - start) / 1000000);
  }

  console.log("\n📊 Pagination Performance Results:");
  printTimingResults("Page 1", timings.page1);
  printTimingResults("Page 2", timings.page2);
  printTimingResults("Page 5", timings.page5);
  printTimingResults("Page 10", timings.page10);
}

async function benchmarkSorting(workspaceId) {
  const { Document } = require("../server/models/documents");

  console.log(`\n⏱️  Benchmarking sorting options...`);

  const sorts = ["recent", "name"];
  const iterations = 3;

  for (const sortBy of sorts) {
    const timings = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await Document.forWorkspacePaginated(workspaceId, 1, 50, sortBy);
      const end = process.hrtime.bigint();
      timings.push(Number(end - start) / 1000000);
    }
    printTimingResults(`Sort by ${sortBy}`, timings);
  }
}

async function benchmarkFiltering(workspaceId) {
  const { Document } = require("../server/models/documents");

  console.log(`\n⏱️  Benchmarking filtering options...`);

  const filters = [null, "pdf", "docx"];
  const iterations = 3;

  for (const filter of filters) {
    const timings = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await Document.forWorkspacePaginated(workspaceId, 1, 50, "recent", filter);
      const end = process.hrtime.bigint();
      timings.push(Number(end - start) / 1000000);
    }
    printTimingResults(`Filter by ${filter || "all types"}`, timings);
  }
}

async function benchmarkPageSizes(workspaceId) {
  console.log(`\n⏱️  Benchmarking different page sizes...`);

  const sizes = [25, 50, 100];
  for (const size of sizes) {
    await benchmarkPagination(workspaceId, size);
  }
}

function printTimingResults(label, timings) {
  const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
  const min = Math.min(...timings);
  const max = Math.max(...timings);

  console.log(`  ${label}:`);
  console.log(`    Average: ${avg.toFixed(2)}ms`);
  console.log(`    Min:     ${min.toFixed(2)}ms`);
  console.log(`    Max:     ${max.toFixed(2)}ms`);
}

async function cleanup(workspaceId) {
  console.log("\n🧹 Cleaning up test documents...");
  try {
    const result = await prisma.workspace_documents.deleteMany({
      where: {
        workspaceId,
        filename: { contains: "test-document" },
      },
    });
    console.log(`✓ Deleted ${result.count} test documents`);
  } catch (error) {
    console.error("Error cleaning up:", error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let workspaceId = 1;
  let docCount = 1000;
  let cleanup_flag = true;

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith("--workspace-id=")) {
      workspaceId = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--doc-count=")) {
      docCount = parseInt(arg.split("=")[1]);
    } else if (arg === "--no-cleanup") {
      cleanup_flag = false;
    }
  }

  console.log("\n🚀 Starting Document Loading Benchmark");
  console.log(`   Workspace ID: ${workspaceId}`);
  console.log(`   Document Count: ${docCount}`);

  try {
    // Create test documents
    const created = await createTestDocuments(workspaceId, docCount);

    if (created === 0) {
      console.log("⚠️  No documents created. Skipping benchmarks.");
      process.exit(0);
    }

    // Wait a moment for database to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Run benchmarks
    await benchmarkPagination(workspaceId, 50);
    await benchmarkSorting(workspaceId);
    await benchmarkFiltering(workspaceId);
    await benchmarkPageSizes(workspaceId);

    // Print summary
    console.log("\n✅ Benchmark completed!");
    console.log(
      "   Target performance: < 100ms per page load with 1000+ documents"
    );

    // Cleanup
    if (cleanup_flag) {
      await cleanup(workspaceId);
    } else {
      console.log(
        "\n⚠️  Test documents not cleaned up (use --no-cleanup to remove later)"
      );
    }
  } catch (error) {
    console.error("\n❌ Benchmark failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
