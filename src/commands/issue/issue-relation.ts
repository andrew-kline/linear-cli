import { Command } from "@cliffy/command"
import { relationCreateCommand } from "./issue-relation-create.ts"
import { relationListCommand } from "./issue-relation-list.ts"
import { relationDeleteCommand } from "./issue-relation-delete.ts"

export const relationCommand = new Command()
  .description("Manage issue relations")
  .action(function () {
    this.showHelp()
  })
  .command("create", relationCreateCommand)
  .command("list", relationListCommand)
  .command("delete", relationDeleteCommand)
