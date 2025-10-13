import path from "path";
import fs from "fs";

const runAfterLexiconApiGeneration = () => {
  const lexiconApiPath = path.join(__dirname, "..", "lexicon-api");

  // Add the following lines to the top of the lexicon-api/index.ts file
  // import {
  //     ComAtprotoRepoListRecords,
  //     ComAtprotoRepoGetRecord,
  //     ComAtprotoRepoCreateRecord,
  //     ComAtprotoRepoPutRecord,
  //     ComAtprotoRepoDeleteRecord,
  //   } from "@atproto/api";

  const lines = [
    "import {",
    "    ComAtprotoRepoListRecords,",
    "    ComAtprotoRepoGetRecord,",
    "    ComAtprotoRepoCreateRecord,",
    "    ComAtprotoRepoPutRecord,",
    "    ComAtprotoRepoDeleteRecord,",
    '  } from "@atproto/api";',
  ];

  const indexTsPath = path.join(lexiconApiPath, "index.ts");
  const indexTsContent = fs.readFileSync(indexTsPath, "utf8");

  // Only add the import if it isn't already present
  const importStatement = lines.join("\n").trim();
  let updatedIndexTsContent = indexTsContent;
  if (!indexTsContent.includes('from "@atproto/api"')) {
    updatedIndexTsContent = [importStatement, indexTsContent].join("\n");
    fs.writeFileSync(indexTsPath, updatedIndexTsContent, "utf8");
    console.log("index.ts updated successfully");
  } else {
    console.log("index.ts already contains the required import");
  }

  // Fix imports in the lexicon-api/lexicons.ts file
  // Find "util.js" within first 100 lines and replace with "util"

  const lexiconsTsPath = path.join(lexiconApiPath, "lexicons.ts");
  const lexiconsTsContent = fs.readFileSync(lexiconsTsPath, "utf8");

  // Split file into lines for easier processing
  const lexiconsTsLines = lexiconsTsContent.split("\n");
  let changed = false;

  // Only look in first 100 lines
  const maxLinesToScan = Math.min(100, lexiconsTsLines.length);

  for (let i = 0; i < maxLinesToScan; i++) {
    if (lexiconsTsLines[i].includes("util.js")) {
      lexiconsTsLines[i] = lexiconsTsLines[i].replace(
        /util\.js(['"])/g,
        "util$1"
      );
      changed = true;
    }
  }

  if (changed) {
    // Re-join and write file only if modified
    const updatedLexiconsTsContent = lexiconsTsLines.join("\n");
    fs.writeFileSync(lexiconsTsPath, updatedLexiconsTsContent, "utf8");
    console.log("lexicons.ts updated successfully");
  } else {
    console.log(
      "No 'util.js' import found within first 100 lines of lexicons.ts"
    );
  }

  console.log(
    "\n If you see errors in the api files, please restart TS server."
  );
};

runAfterLexiconApiGeneration();
