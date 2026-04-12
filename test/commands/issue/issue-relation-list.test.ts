import { snapshotTest } from "@cliffy/testing"
import { relationListCommand } from "../../../src/commands/issue/issue-relation-list.ts"
import {
  commonDenoArgs,
  setupMockLinearServer,
} from "../../utils/test-helpers.ts"

// Test help output
await snapshotTest({
  name: "Issue Relation List Command - Help Text",
  meta: import.meta,
  colors: false,
  args: ["--help"],
  denoArgs: commonDenoArgs,
  async fn() {
    await relationListCommand.parse()
  },
})

// Test listing relations
await snapshotTest({
  name: "Issue Relation List Command - With Relations",
  meta: import.meta,
  colors: false,
  args: ["TEST-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "IssueRelationsList",
        response: {
          data: {
            issue: {
              identifier: "TEST-123",
              relations: {
                nodes: [
                  {
                    id: "rel-1",
                    type: "blocks",
                    relatedIssue: {
                      identifier: "TEST-456",
                      title: "Fix login bug",
                    },
                  },
                ],
              },
              inverseRelations: {
                nodes: [
                  {
                    id: "rel-2",
                    type: "related",
                    issue: {
                      identifier: "TEST-789",
                      title: "Update auth flow",
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ])

    try {
      await relationListCommand.parse()
    } finally {
      await cleanup()
    }
  },
})

// Test no relations found
await snapshotTest({
  name: "Issue Relation List Command - No Relations",
  meta: import.meta,
  colors: false,
  args: ["TEST-123"],
  denoArgs: commonDenoArgs,
  async fn() {
    const { cleanup } = await setupMockLinearServer([
      {
        queryName: "IssueRelationsList",
        response: {
          data: {
            issue: {
              identifier: "TEST-123",
              relations: {
                nodes: [],
              },
              inverseRelations: {
                nodes: [],
              },
            },
          },
        },
      },
    ])

    try {
      await relationListCommand.parse()
    } finally {
      await cleanup()
    }
  },
})
