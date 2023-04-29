import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: "edge"
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
const openAiKey = process.env.OPENAI_API_KEY
const handler = async (req: Request): Promise<Response> => {
  try {
    const { query, repoUrl, matches } = (await req.json()) as {
      query: string;
      repoUrl: string,
      matches: number;
    };

    const input = query.replace(/\n/g, " ");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input
      })
    });

    const json = await res.json();
    const embedding = json.data[0].embedding;

    const { data: chunks, error } = await supabaseAdmin.rpc("github_data_search", {
      query_embedding: embedding,
      similarity_threshold: 0.05,
      input_repo_url: repoUrl,
      match_count: matches
    });

    if (error) {
      console.error("github_data_search: ",error);
      return new Response("Error", { status: 500 });
    }

    return new Response(JSON.stringify(chunks), { status: 200 });
  } catch (error) {
    console.error("github_data_search embedding: ",error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
