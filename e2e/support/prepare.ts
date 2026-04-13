import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const main = async () => {
  await Promise.all([
    mkdir(path.resolve(root, "reports"), { recursive: true }),
    mkdir(path.resolve(root, "reports/screenshots"), { recursive: true }),
  ]);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
