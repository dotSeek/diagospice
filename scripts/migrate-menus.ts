// Moves the menus to the centralised model. Dry run by default: it changes nothing.
//
//   npm run menu:migrate                 dry run: report and before and after comparison
//   npm run menu:migrate -- --apply      backup, then write the v2 documents
//   npm run menu:migrate -- --apply --force   also replace v2 documents that already exist
//
// It uses the same storage as the site: Upstash Redis when its variables are set (.env or the
// shell), otherwise the local files in private/store/ (or STORE_DIR). The server code is loaded
// through Vite so its imports resolve exactly as they do in the site.
import { writeFileSync } from "node:fs";
import { createServer, loadEnv } from "vite";

const args = new Set(process.argv.slice(2));
Object.assign(process.env, { ...loadEnv("development", process.cwd(), ""), ...process.env });

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { dryRun, apply } = (await vite.ssrLoadModule("/server/migrate.ts")) as typeof import("../server/migrate.ts");
  const result = await dryRun();
  console.log(`Storage: ${result.storage}`);
  console.log(`Master items: ${result.items} in ${result.categories} categories`);
  for (const decision of result.report.decisions) console.log(`Decision: ${decision}`);
  for (const [venue, menu] of Object.entries(result.menus)) {
    console.log(`\n${venue}: ${menu.lines} customer lines compared, ${menu.removed.length + menu.added.length} unexpected differences, ${menu.approved.length} approved`);
    for (const line of menu.removed) console.log(`  before only: ${line}`);
    for (const line of menu.added) console.log(`  after only:  ${line}`);
    for (const line of menu.approved) console.log(`  approved:    ${line.trim()}`);
  }
  if (result.legacyDrafts.length) console.log(`\nUnpublished drafts (not migrated, publish or discard them first): ${result.legacyDrafts.join(", ")}`);
  const reportFile = process.env.MIGRATION_REPORT;
  if (reportFile) writeFileSync(reportFile, JSON.stringify(result, null, 2));

  if (!args.has("--apply")) {
    console.log(`\nDry run only. Nothing was written. ${result.unexpected ? "Fix the differences above before applying." : "Ready to apply."}`);
  } else {
    const done = await apply({ force: args.has("--force") });
    console.log(`\nBackup: ${done.backupKey}`);
    for (const key of done.written) console.log(`Written: ${key}`);
    for (const key of done.kept) console.log(`Kept (already exists, newer admin changes): ${key}`);
    console.log("Legacy documents were not changed. Set MENU_MODEL=v2 to use the new model, unset it to roll back.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await vite.close();
}
