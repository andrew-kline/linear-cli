import { Command } from "@cliffy/command"
import { Confirm } from "@cliffy/prompt"
import { gql } from "../../__codegen__/gql.ts"
import { getGraphQLClient } from "../../utils/graphql.ts"

export const relationDeleteCommand = new Command()
  .name("delete")
  .description("Delete an issue relation")
  .arguments("<relationId:string>")
  .option("-y, --confirm", "Skip confirmation prompt")
  .action(async (options, relationId) => {
    const client = getGraphQLClient()

    // Fetch relation details for confirmation display
    const detailsQuery = gql(`
      query IssueRelationDetails($id: String!) {
        issueRelation(id: $id) {
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
    `)

    let relation
    try {
      const data = await client.request(detailsQuery, { id: relationId })
      relation = data.issueRelation
    } catch (error) {
      console.error(`✗ Relation not found: ${relationId}`, error)
      Deno.exit(1)
    }

    if (!options.confirm) {
      if (!Deno.stdin.isTerminal()) {
        console.error(
          "Interactive confirmation required. Use --confirm to skip.",
        )
        Deno.exit(1)
      }
      const confirmed = await Confirm.prompt({
        message:
          `Delete relation: ${relation.issue.identifier} ${relation.type} ${relation.relatedIssue.identifier}?`,
        default: false,
      })

      if (!confirmed) {
        console.log("Delete cancelled.")
        return
      }
    }

    const mutation = gql(`
      mutation IssueRelationDelete($id: String!) {
        issueRelationDelete(id: $id) {
          success
        }
      }
    `)

    try {
      const data = await client.request(mutation, { id: relationId })

      if (!data.issueRelationDelete.success) {
        throw new Error("Failed to delete relation")
      }

      console.log(
        `✓ Deleted relation: ${relation.issue.identifier} ${relation.type} ${relation.relatedIssue.identifier}`,
      )
    } catch (error) {
      console.error("✗ Failed to delete relation:", error)
      Deno.exit(1)
    }
  })
