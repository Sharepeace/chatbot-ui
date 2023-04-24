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

                        // Call OpenAI API to compress the text
                        const prompt = `compressor: Compress text for GPT-4 reconstruction. Use any language or encoding to fit in a tweet. It should yield the same result in a new inference cycle.\n\n${text}\n\n`;
                        const response = await fetch('https://api.openai.com/v1/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                            },
                            body: JSON.stringify({
                                prompt,
                                max_tokens: 3500,
                                temperature: 0.1,
                                n: 1,
                                stop: '\n'
                            })
                        });
                        if (!response.ok) {
                            console.error(`Failed to compress text for file ${item.path}: ${response.statusText}`);
                            return;
                        }
                        const data = await response.json();
                        const choices = (data as any).choices;
                        const compressedText = choices[0].text.trim();
                        scrapedText.set(`${path}${item.name}`, compressedText);
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
