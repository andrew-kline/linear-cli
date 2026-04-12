import { snapshotTest } from "@cliffy/testing"
import { relationDeleteCommand } from "../../../src/commands/issue/issue-relation-delete.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue Relation Delete Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await relationDeleteCommand.parse()
  },
})

// Test successful deletion with --confirm
await snapshotTest({
  name: "Issue Relation Delete Command - Success",
  meta: import.meta,
  colors: false,
  args: ["relation-uuid-789", "--confirm"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "IssueRelationDetails",
        response: {
          data: {
            issueRelation: {
              id: "relation-uuid-789",
              type: "blocks",
              issue: {
                identifier: "TEST-123",
              },
              relatedIssue: {
                identifier: "TEST-456",
              },
            },
          },
        },
      },
      {
        queryName: "IssueRelationDelete",
        response: {
          data: {
            issueRelationDelete: {
              success: true,
            },
          },
        },
      },
    ])

    try {
      await relationDeleteCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
