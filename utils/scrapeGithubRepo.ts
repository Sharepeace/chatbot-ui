import fetch from "node-fetch";
const apiKey = process.env.OPENAI_API_KEY || '';

type GitHubContentItem = {
    name: string;
    path: string;
    url: string;
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

    const scrapedText = new Map<string, string>();
    const stack = [''];
    while (stack.length) {
        const path = stack.pop()!;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) {
            console.error(`Failed to scrape ${apiUrl}: ${response.statusText}`);
            continue;
        }
        const contents = await response.json() as GitHubContentItem[];

        // Make up to 5 requests in parallel using Promise.all()
        const promises: Promise<void>[] = [];
        for (const item of contents) {
            if (item.type === "file") {
                if (shouldIgnore(item.path) || item.name === "package-lock.json") {
                    console.log(`Ignoring file ${item.path}`);
                } else {
                    promises.push((async () => {
                        await delay(100);
                        const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}${item.name}`;
                        const fileResponse = await fetch(fileUrl, { headers });
                        if (!fileResponse.ok) {
                            console.error(`Failed to scrape file ${item.path}: ${fileResponse.statusText}`);
                            return;
                        }
                        let text = await fileResponse.text();
                        text = text.replace(/\r?\n|\r/g, '').trim(); // Remove newlines and trim the text
                        scrapedText.set(`${path}${item.name}`, text);
                    })());
                }
            } else if (item.type === "dir") {
                stack.push(`${path}${item.name}/`);
            }
        }
        await Promise.all(promises);
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
        /\.json$/,
        /pnpm-lock\.yaml$/,
        /\.(jpg|jpeg|png|gif|bmp|tiff|webp|ico|svg)$/i, // Image file extensions
        /\.(pdf|docx?|xlsx?|pptx?|exe|dll|bin|so|zip|tar|gz|bz2)$/i, // Binary file extensions
    ];

    return ignorePatterns.some((pattern) => pattern.test(filePath));
}


export default scrapeGithubRepo;
