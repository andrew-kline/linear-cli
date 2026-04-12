import { Command } from "@cliffy/command"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { getIssueIdentifier } from "../../utils/linear.ts"
import { getNoIssueFoundMessage } from "../../utils/vcs.ts"

const RELATION_LABELS: Record<string, string> = {
  blocks: "blocks",
  related: "relates to",
  duplicate: "duplicates",
  similar: "is similar to",
}

const INVERSE_RELATION_LABELS: Record<string, string> = {
  blocks: "is blocked by",
  related: "relates to",
  duplicate: "is duplicated by",
  similar: "is similar to",
}

interface RelationRow {
  direction: string
  type: string
  identifier: string
  title: string
  relationId: string
}

export const relationListCommand = new Command()
  .name("list")
  .description("List relations for an issue")
  .arguments("[issueId:string]")
  .option("-j, --json", "Output as JSON")
  .action(async (options, issueId) => {
    const resolvedId = await getIssueIdentifier(issueId)
    if (!resolvedId) {
      console.error(getNoIssueFoundMessage())
      Deno.exit(1)
    }

    const query = gql(`
      query IssueRelationsList($id: String!) {
        issue(id: $id) {
          identifier
          relations {
            nodes {
              id
              type
              relatedIssue {
                identifier
                title
              }
            }
          }
          inverseRelations {
            nodes {
              id
              type
              issue {
                identifier
                title
              }
            }
          }
        }
      }
    `)

    const client = getGraphQLClient()

    try {
      const data = await client.request(query, { id: resolvedId })

      if (!data.issue) {
        console.error(`✗ Issue not found: ${resolvedId}`)
        Deno.exit(1)
      }

      const rows: RelationRow[] = []

      for (const rel of data.issue.relations.nodes) {
        rows.push({
          direction: "→",
          type: RELATION_LABELS[rel.type] ?? rel.type,
          identifier: rel.relatedIssue.identifier,
          title: rel.relatedIssue.title,
          relationId: rel.id,
        })
      }

      for (const rel of data.issue.inverseRelations.nodes) {
        rows.push({
          direction: "←",
          type: INVERSE_RELATION_LABELS[rel.type] ?? rel.type,
          identifier: rel.issue.identifier,
          title: rel.issue.title,
          relationId: rel.id,
        })
      }

      if (options.json) {
        console.log(JSON.stringify(rows, null, 2))
        return
      }

      if (rows.length === 0) {
        console.log(`No relations found for ${data.issue.identifier}`)
        return
      }

      console.log(`Relations for ${data.issue.identifier}:\n`)

      // Compute column widths
      const typeWidth = Math.max(
        ...rows.map((r) => r.type.length),
        4,
      )
      const idWidth = Math.max(
        ...rows.map((r) => r.identifier.length),
        10,
      )

      for (const row of rows) {
        console.log(
          `  ${row.direction} ${row.type.padEnd(typeWidth)}  ${
            row.identifier.padEnd(idWidth)
          }  ${row.title}`,
        )
      }
    } catch (error) {
      console.error("✗ Failed to list relations:", error)
      Deno.exit(1)
    }
  })
