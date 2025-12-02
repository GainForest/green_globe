import { BskyAgent } from "@atproto/api";
import * as readline from "readline";

// Your PDS service URL
const PDS_URL = "https://bsky.social";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Hide password input (basic implementation)
function questionPassword(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    process.stdout.write(prompt);
    let password = "";

    const onData = (char) => {
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        process.exit();
      } else if (char === "\u007f" || char === "\b") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        password += char;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

async function login() {
  try {
    // Get user credentials
    const identifier = await question("Enter your handle or email: ");
    const password = await questionPassword("Enter your password: ");

    console.log("\nAuthenticating...");

    // Create agent and login
    const agent = new BskyAgent({
      service: PDS_URL,
    });

    const response = await agent.login({
      identifier: identifier.trim(),
      password: password,
    });

    console.log("\n✓ Login successful!");
    console.log("\nSession Details:");
    console.log("DID:", agent.session?.did);
    console.log("Handle:", agent.session?.handle);
    console.log(
      "Access Token:",
      agent.session?.accessJwt?.substring(0, 20) + "..."
    );
    console.log(
      "Refresh Token:",
      agent.session?.refreshJwt?.substring(0, 20) + "..."
    );

    // Store session for later use
    const session = agent.session;
    console.log("\nFull session object:");
    console.log(JSON.stringify(session, null, 2));

    return session;
  } catch (error) {
    console.error("\n✗ Login failed:", error.message);
    if (error.status) {
      console.error("Status:", error.status);
    }
  } finally {
    rl.close();
  }
}

// Run the login
login();
