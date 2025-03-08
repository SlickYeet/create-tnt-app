import path from "path"
import * as p from "@clack/prompts"
import chalk from "chalk"
import fs from "fs-extra"
import ora from "ora"

import { PKG_ROOT } from "@/constants.js"
import { type InstallerOptions } from "@/installers/index.js"
import { logger } from "@/utils/logger.js"

// This bootstraps teh base Next.js app
export async function scaffoldProject({
  projectName,
  projectDir,
  pkgManager,
  noInstall,
}: InstallerOptions) {
  const srcDir = path.join(PKG_ROOT, "template/base")

  if (!noInstall) {
    logger.info(`\nUsing: ${chalk.cyan.bold(pkgManager)}\n`)
  } else {
    logger.info("")
  }

  const spinner = ora(`Scaffolding in: ${projectDir}...\n`).start()

  if (fs.existsSync(projectDir)) {
    if (fs.readdirSync(projectDir).length === 0) {
      if (projectName !== ".")
        spinner.info(
          `${chalk.cyan.bold(projectName)} exists but is empty, continuing...\n`
        )
    } else {
      spinner.stopAndPersist()
      const overwriteDir = await p.select({
        message: `${chalk.redBright.bold("Warning:")} ${chalk.cyan.bold(
          projectName
        )} already exists and isn't empty. How would you like to proceed?`,
        options: [
          {
            value: "abort",
            label: "Abort installation (recommended)",
          },
          {
            value: "clear",
            label: "Clear the directory and continue installation",
          },
          {
            value: "overwrite",
            label: "Continue installation and overwrite conflicting files",
          },
        ],
        initialValue: "abort",
      })

      if (p.isCancel(overwriteDir) || overwriteDir === "abort") {
        spinner.fail("Aborting installation...")
        process.exit(1)
      }

      const confirmOverwriteDir = await p.confirm({
        message: `Are you sure you want to ${
          overwriteDir === "clear"
            ? "clear the directory"
            : "overwrite conflicting files"
        }`,
        initialValue: false,
      })

      if (p.isCancel(confirmOverwriteDir) || !confirmOverwriteDir) {
        spinner.fail("Aborting installation...")
        process.exit(1)
      }

      if (overwriteDir === "clear") {
        spinner.info(
          `Emptying ${chalk.cyan.bold(projectName)} and creating tnt app...\n`
        )
        fs.emptyDirSync(projectDir)
      }
    }
  }

  spinner.start()

  fs.copySync(srcDir, projectDir)
  fs.renameSync(
    path.join(projectDir, "_gitignore"),
    path.join(projectDir, ".gitignore")
  )

  const scaffoldedName =
    projectName === "." ? "App" : chalk.cyan.bold(projectName)

  spinner.succeed(
    `${scaffoldedName} ${chalk.green.bold("scaffolded successfully!")}\n`
  )
}
