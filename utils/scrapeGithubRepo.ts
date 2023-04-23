import fetch from "node-fetch";

type GitHubContentItem = {
    name: string;
    path: string;
    type: "file" | "dir";
};
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function scrapeGithubRepo(repoUrl: string, token?: string): Promise<Map<string, string>> {
    const matches = repoUrl.match(/github\.com\/(.+)\/(.+)/);
    if (!matches) {
        throw new Error("Invalid GitHub repository URL");
    }
    const [, owner, repo] = matches;
    const headers = token ? { Authorization: `token ${token}` } : undefined;

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
        throw new Error(`Failed to scrape repository ${repoUrl}: ${response.statusText}`);
    }

    const files: string[] = [];
    const folders: string[] = [];
    const contents = (await response.json()) as GitHubContentItem[];
    for (const item of contents) {
        if (item.type === "file") {
            if (item.name !== "package-lock.json") { // Add this condition
                files.push(item.name);
            }
        } else if (item.type === "dir") {
            folders.push(item.path);
        }
    }

    const scrapedText = new Map<string, string>();
    for (const file of files) {
        await delay(100); // Add a 300ms delay before each file request

        const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${file}`;
        const fileResponse = await fetch(fileUrl, { headers });

        if (!fileResponse.ok) {
            console.error(`Failed to scrape file ${file}: ${fileResponse.statusText}`);
        } else {
            let text = await fileResponse.text();
            text = text.replace(/\r?\n|\r/g, '').trim(); // Remove newlines and trim the text
            scrapedText.set(file, text);
        }
    }

    for (const folder of folders) {
        await delay(100); // Add a 300ms delay before each file request

        const folderUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;
        const folderResponse = await fetch(folderUrl, { headers });

        if (!folderResponse.ok) {
            console.error(`Failed to scrape folder ${folder}: ${folderResponse.statusText}`);
        } else {
            const subfolderContents = (await folderResponse.json()) as GitHubContentItem[];
            for (const item of subfolderContents) {
                if (item.type === "file" && !shouldIgnore(item.path)) {
                    const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${item.path}`;
                    const fileResponse = await fetch(fileUrl, { headers });
                    if (!fileResponse.ok) {
                        console.error(`Failed to scrape file ${item.path}: ${fileResponse.statusText}`);
                    } else {
                        let text = await fileResponse.text();
                        text = text.replace(/\r?\n|\r/g, '').trim(); // Remove newlines and trim the text
                        scrapedText.set(item.path, text);
                    }
                } else if (item.type === "dir") {
                    // ... (rest of the code remains the same)
                }
            }
        }
    }

    return scrapedText;
}

function shouldIgnore(filePath: string) {
    const ignorePatterns = [
      /\/node_modules\//,
      /\/\.pnp\//,
      /\.pnp\.js$/,
      /\/coverage\//,
      /\/test-results\//,
      /\/\.next\//,
      /\/out\//,
      /\/dist\//,
      /\/build\//,
      /\.DS_Store$/,
      /\.pem$/,
      /npm-debug\.log.*$/,
      /yarn-debug\.log.*$/,
      /yarn-error\.log.*$/,
      /\.pnpm-debug\.log.*$/,
      /\.env.*\.local$/,
      /\.vercel$/,
      /\.tsbuildinfo$/,
      /next-env\.d\.ts$/,
      /\.idea$/,
      /pnpm-lock\.yaml$/,
      /\.(jpg|jpeg|png|gif|bmp|tiff|webp|ico|svg)$/i, // Image file extensions
      /\.(pdf|docx?|xlsx?|pptx?|exe|dll|bin|so|zip|tar|gz|bz2)$/i, // Binary file extensions
    ];
  
    return ignorePatterns.some((pattern) => pattern.test(filePath));
  }
  

export default scrapeGithubRepo;
