
import { analyzeTicket } from "./index.js";

const testCases = [
  {
    id: 1,
    name: "Missing royalty payment",
    expectedCategory: "Royalty & Payments",
    ticket: {
      subject: "I haven't received my royalties",
      description:
        "I published my book four months ago and have not received " +
        "any royalty payment. Can you explain how I should check this?",
    },
  },
  {
    id: 2,
    name: "Incorrect ISBN",
    expectedCategory: "ISBN & Metadata",
    ticket: {
      subject: "Incorrect ISBN printed on my book",
      description:
        "The ISBN assigned to my book does not match the ISBN in my " +
        "publishing dashboard. Please help me resolve this urgently.",
    },
  },
  {
    id: 3,
    name: "Damaged printed copies",
    expectedCategory: "Printing & Quality",
    ticket: {
      subject: "My printed books arrived damaged",
      description:
        "Several copies arrived with torn pages and damaged covers. " +
        "What evidence do you need, and can these copies be replaced?",
    },
  },
  {
    id: 4,
    name: "Book missing from online store",
    expectedCategory: "Distribution",
    ticket: {
      subject: "My book is not showing on Amazon",
      description:
        "My book was published recently, but I cannot find its listing " +
        "on Amazon. Can you check what I should do next?",
    },
  },
  {
    id: 5,
    name: "Production delay",
    expectedCategory: "Production Updates",
    ticket: {
      subject: "My book is stuck in cover design",
      description:
        "My dashboard has shown the cover design stage for longer than " +
        "I expected. Please explain the next steps and how I can get an update.",
    },
  },
  {
    id: 6,
    name: "General account question",
    expectedCategory: "General",
    ticket: {
      subject: "How can I update my contact email?",
      description:
        "I want to change the email address associated with my author " +
        "account. Please tell me how to proceed.",
    },
  },
];

async function main() {
  const results = [];

  console.log(`Running ${testCases.length} BookLeaf AI tests...\n`);

  // Run sequentially to reduce the chance of hitting API rate limits.
  for (const testCase of testCases) {
    console.log(
      `[${testCase.id}/${testCases.length}] ${testCase.name}`
    );

    try {
      const result = await analyzeTicket(testCase.ticket);

      const categoryPassed =
        result.category === testCase.expectedCategory;

      const isbnPriorityPassed =
        testCase.expectedCategory !== "ISBN & Metadata" ||
        result.priority === "High";

      const passed = categoryPassed && isbnPriorityPassed;

      results.push({
        id: testCase.id,
        name: testCase.name,
        passed,
        categoryPassed,
        isbnPriorityPassed,
        expectedCategory: testCase.expectedCategory,
        actualCategory: result.category,
        priority: result.priority,
        result,
      });

      console.log(`  Expected: ${testCase.expectedCategory}`);
      console.log(`  Actual:   ${result.category}`);
      console.log(`  Priority: ${result.priority}`);
      console.log(`  Status:   ${passed ? "PASS" : "FAIL"}`);

      if (!categoryPassed) {
        console.log("  Issue: Incorrect category.");
      }

      if (!isbnPriorityPassed) {
        console.log("  Issue: ISBN ticket must be High priority.");
      }

      console.log("\n  AI reply draft:");
      console.log(`  ${result.replyDraft}`);
      console.log("\n  Recommended internal action:");
      console.log(`  ${result.recommendedAction}`);
    } catch (error) {
      results.push({
        id: testCase.id,
        name: testCase.name,
        passed: false,
        error: error.message,
      });

      console.log(`  Status: ERROR`);
      console.log(`  Message: ${error.message}`);
    }

    console.log("\n" + "-".repeat(65) + "\n");
  }

  const passedCount = results.filter((item) => item.passed).length;
  const failedCount = results.length - passedCount;

  console.log("========== TEST SUMMARY ==========");
  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(
    `Category accuracy on this sample: ${
      (
        (results.filter((item) => item.categoryPassed).length /
          results.length) *
        100
      ).toFixed(1)
    }%`
  );

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Test runner failed:", error.message);
  process.exitCode = 1;
});
