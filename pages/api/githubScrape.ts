import type { NextApiRequest, NextApiResponse } from "next";
import scrapeGithubRepo from "../../utils/scrapeGithubRepo";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

/**
 * compress the input
 * need to compress the user query as well.
 * compressor: Compress text for GPT-4 reconstruction. Use any language or encoding to fit in a tweet. It should yield the same result in a new inference cycle. 
 * @param req 
 * @param res 
 * @returns 
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log("Request query:", req.query); // Log the request query

        const repoUrl = req.query.repoUrl as string;
        if (typeof repoUrl !== "string") {
            return res.status(400).json({ error: "Invalid repoUrl parameter" });
        }

        // array of tuple [filename, fileContent]..
        const scrapedText = await scrapeGithubRepo(repoUrl, process.env.GITHUB_TOKEN);

        res.status(200).json({ data: Array.from(scrapedText.entries()) });
    } catch (error) {
        const err = error as Error & { code?: string, message?: string }; // Assert the type of error
        res.status(400).json({ error: err.message });
    }
}

