import { createEmbeddings } from "../../services/createEmbeddings";
import type { NextApiRequest, NextApiResponse } from "next";
import scrapeGithubRepo from "../../utils/scrapeGithubRepo";
import { loadEnvConfig } from "@next/env";
import { FileLite } from "@/types/file";
import { createClient } from "@supabase/supabase-js";
import { scrapeAndStoreData } from '../../utils/scrapeAndStore';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log("Request query:", req.query); // Log the request query

        const repoUrl = req.query.repoUrl as string;
        const apiKey = req.query.apiKey as string;
        const user =  ''; //supabase.auth.getUser();

        if (typeof repoUrl !== "string") {
            return res.status(400).json({ error: "Invalid repoUrl parameter" });
        }

        // array of tuple [filename, fileContent]..
        const data = await scrapeGithubRepo(repoUrl, process.env.GITHUB_TOKEN);
        console.log("process-github-repo scrapeGithubRepo: ");

        const isComplete = await scrapeAndStoreData(user, repoUrl, data, apiKey);

        // Return the validFiles array in the response
        res.status(200).json({ repoUrl: repoUrl });
    } catch (error) {
        const err = error as Error & { code?: string, message?: string }; // Assert the type of error
        res.status(400).json({ error: err.message });
    }
}

