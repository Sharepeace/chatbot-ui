import { createEmbeddings } from "../../services/createEmbeddings";
import type { NextApiRequest, NextApiResponse } from "next";
import scrapeGithubRepo from "../../utils/scrapeGithubRepo";
import { loadEnvConfig } from "@next/env";
import { FileLite } from "@/types/file";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log("Request query:", req.query); // Log the request query

        const repoUrl = req.query.repoUrl as string;
        if (typeof repoUrl !== "string") {
            return res.status(400).json({ error: "Invalid repoUrl parameter" });
        }

        // array of tuple [filename, fileContent]..
        const data = await scrapeGithubRepo(repoUrl, process.env.GITHUB_TOKEN);
        console.log("process-github-repo scrapeGithubRepo: ");

        // processing the data. create embedding and add to supabase        
        const processedFiles = await Promise.all(
            Array.from(data.entries()).map(async ([fileName, fileText]) => {
                try {
                    console.log("process-github-repo createEmbeddings: ", fileName);
                    const { meanEmbedding, chunks } = await createEmbeddings({
                        fileName: fileName,
                        text: fileText,
                    });

                    const fileObject: FileLite = {
                        name: fileName,
                        url: repoUrl,
                        type: "text/plain",
                        size: fileText.length,
                        expanded: false,
                        embedding: meanEmbedding,
                        chunks,
                        extractedText: fileText,
                    };
                    const { data, error } = await supabase
                        .from("github-chatbot")
                        .insert(fileObject) // Insert the fileObject directly

                        .select("*");

                    if (error) {
                        console.log("error", error);
                    } else {
                        console.log("saved", data);
                    }
                    return fileObject;
                } catch (error: any) {
                    console.error(`Error creating file embedding: ${error}`);
                    return null;
                }
            })
        );

        // Filter out any null values from the processedFiles array
        const validFiles = processedFiles.filter((file) => file !== null);

        // Return the validFiles array in the response
        res.status(200).json({ files: validFiles });
    } catch (error) {
        const err = error as Error & { code?: string, message?: string }; // Assert the type of error
        res.status(400).json({ error: err.message });
    }
}

