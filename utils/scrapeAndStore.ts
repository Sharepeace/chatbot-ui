import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types_db';
import { Configuration, OpenAIApi } from "openai";
import { encode } from "gpt-3-encoder";
import { v4 as uuidv4 } from 'uuid';

// Initialize your Supabase client
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const chunkText = (text: string, size: number): string[] => {
    const chunks = [];
    const buffer = Buffer.from(text);
    for (let i = 0; i < buffer.length; i += size) {
        chunks.push(buffer.slice(i, i + size).toString());
    }
    return chunks;
};

const processData = async (repoUrl: string, fileName: string, fileText: string) => {

    const content = fileText;
    const chunks = chunkText(content, 1000);

    for (const chunk of chunks) {
        const contentLength = Buffer.byteLength(chunk, 'utf-8');
        const embedding = await createEmbedding(chunk);
        const id = uuidv4();

        console.log('fileName:', fileName);

        const { error } = await supabaseAdmin.from('github_chatbot').insert([
            {
                id: id,
                repo_url: repoUrl,
                file_name: fileName,
                content: chunk,
                content_length: contentLength,
                content_token: encode(chunk).length,
                embedding: embedding,
            },
        ]);

        if (error) {
            console.error('Failed to store scraped data', error);
        }
    }
};

async function scrapeAndStoreData(repoUrl: string, data:  Map<string, string>) {
    try {
        await Promise.all(
            Array.from(data.entries()).map(async ([fileName, fileText]) => processData(repoUrl, fileName, fileText)));
        return true;
    } catch (error) {
        console.error('Failed to scrape and store data', error);
        return false;
    }
}

async function createEmbedding(content: string) {
    // Implement this function to create the vector representation of the content
    // For example, you can use a pre-trained model from TensorFlow.js or other libraries
    const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: content
    });
    const [{ embedding }] = embeddingResponse.data.data;
    return embedding;
}

export { scrapeAndStoreData };

