import "dotenv/config";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Test the authentication
const { data: user } = await octokit.rest.users.getAuthenticated();

console.log("Connected as:", user.login);