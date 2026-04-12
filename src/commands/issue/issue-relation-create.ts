import { Command, EnumType } from "@cliffy/command"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"
import { getIssueId, getIssueIdentifier } from "../../utils/linear.ts"
import { getNoIssueFoundMessage } from "../../utils/vcs.ts"

const relationType = new EnumType(["blocks", "related", "duplicate", "similar"])

const RELATION_LABELS: Record<string, string> = {
  blocks: "blocks",
  related: "relates to",
  duplicate: "duplicates",
  similar: "is similar to",
}

export const relationCreateCommand = new Command()
  .name("create")
  .description("Create a relation between two issues")
  .type("relation-type", relationType)
  .arguments("<issueId:string> <relatedIssueId:string>")
  .option(
    "-t, --type <type:relation-type>",
    "Relation type",
    { required: true },
  )
  .action(async (options, issueId, relatedIssueId) => {
    const { type } = options

    const resolvedIssue = await getIssueIdentifier(issueId)
    if (!resolvedIssue) {
      console.error(getNoIssueFoundMessage())
      Deno.exit(1)
    }

    const resolvedRelated = await getIssueIdentifier(relatedIssueId)
    if (!resolvedRelated) {
      console.error(`✗ Related issue not found: ${relatedIssueId}`)
      Deno.exit(1)
    }

    const issueUuid = await getIssueId(resolvedIssue)
    if (!issueUuid) {
      console.error(`✗ Issue not found: ${resolvedIssue}`)
      Deno.exit(1)
    }

    const relatedUuid = await getIssueId(resolvedRelated)
    if (!relatedUuid) {
      console.error(`✗ Related issue not found: ${resolvedRelated}`)
      Deno.exit(1)
    }

    const mutation = gql(`
      mutation IssueRelationCreate($input: IssueRelationCreateInput!) {
        issueRelationCreate(input: $input) {
          success
          issueRelation {
            id
            type
            issue {
              identifier
            }
            relatedIssue {
              identifier
            }
          }
        }
      }
    `)

    const client = getGraphQLClient()

    try {
      const data = await client.request(mutation, {
        input: {
          issueId: issueUuid,
          relatedIssueId: relatedUuid,
          type,
        },
      })

      if (!data.issueRelationCreate.success) {
        throw new Error("Failed to create relation")
      }

      const relation = data.issueRelationCreate.issueRelation
      const label = RELATION_LABELS[relation.type] ?? relation.type
      console.log(
        `✓ ${relation.issue.identifier} ${label} ${relation.relatedIssue.identifier}`,
      )
    } catch (error) {
      console.error("✗ Failed to create relation:", error)
      Deno.exit(1)
    }
  })
