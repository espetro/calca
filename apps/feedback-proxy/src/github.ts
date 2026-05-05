import { Octokit } from "octokit";

import { FeedbackRequest } from "./types.js";

/**
 * Creates a GitHub issue from feedback data using the provided token and repo.
 *
 * @param params - The parameters for creating the issue
 * @param params.token - GitHub personal access token
 * @param params.repo - GitHub repository in "owner/repo" format
 * @param params.data - The validated feedback request data
 * @returns Either a successful result with issue URL and number, or an error
 */
export async function createIssue(params: {
  token: string;
  repo: string;
  data: FeedbackRequest;
}): Promise<{ ok: true; issueUrl: string; issueNumber: number } | { ok: false; error: string }> {
  const { token, repo, data } = params;

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return { ok: false, error: "Invalid GITHUB_REPO format" };
  }

  const octokit = new Octokit({ auth: token });

  const metadataLines: string[] = [];
  if (data.email) metadataLines.push(`- **Email**: ${data.email}`);
  if (data.metadata)
    metadataLines.push(`- **Metadata**: ${JSON.stringify(data.metadata, null, 2)}`);
  const metadataSection =
    metadataLines.length > 0 ? `\n### Metadata\n${metadataLines.join("\n")}\n` : "";

  const bodyMarkdown = [
    `## ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Report`,
    "",
    data.description,
    "",
    `---`,
    `*Submitted via Feedback Proxy*${metadataSection}`,
    "",
    "<!-- powered-by-feedback-proxy -->",
  ].join("\n");

  try {
    const response = await octokit.rest.issues.create({
      owner,
      repo: repoName,
      title: `[${data.type.toUpperCase()}] ${data.title}`,
      body: bodyMarkdown,
      labels: ["user-feedback", data.type],
    });

    const responseData = response.data;
    return {
      ok: true,
      issueUrl: responseData.html_url,
      issueNumber: responseData.number,
    };
  } catch (err) {
    console.error("[feedback-proxy] GitHub API error:", err);
    return { ok: false, error: "Failed to create GitHub issue. Please try again." };
  }
}
