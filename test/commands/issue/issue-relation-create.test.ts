import { snapshotTest } from "@cliffy/testing"
import { relationCreateCommand } from "../../../src/commands/issue/issue-relation-create.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue Relation Create Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await relationCreateCommand.parse()
  },
})

// Test successful relation creation
await snapshotTest({
  name: "Issue Relation Create Command - Success",
  meta: import.meta,
  colors: false,
  args: ["TEST-123", "TEST-456", "--type", "blocks"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "GetIssueId",
        variables: { id: "TEST-123" },
        response: {
          data: {
            issue: {
              id: "issue-uuid-123",
            },
          },
        },
      },
      {
        queryName: "GetIssueId",
        variables: { id: "TEST-456" },
        response: {
          data: {
            issue: {
              id: "issue-uuid-456",
            },
          },
        },
      },
      {
        queryName: "IssueRelationCreate",
        response: {
          data: {
            issueRelationCreate: {
              success: true,
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
      },
    ])

    try {
      await relationCreateCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
