import { NextApiRequest } from 'next'

import { searchFileChunks } from "../../services/searchFileChunks";
import { FileChunk, FileLite } from "../../types/file";

type Data = {
  searchResults?: FileChunk[];
  error?: string;
};

export const config = {
  runtime: 'edge',
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

export default async function handler(req: NextApiRequest) {
  try {
    const searchQuery = req.body.searchQuery as string;

    const files = req.body.files as FileLite[];

    const maxResults = req.body.maxResults as number;

    if (!searchQuery || typeof searchQuery !== 'string') {
      return new Response('Error: searchQuery must be a string', {
        status: 400,
      });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return new Response('Error: files must be a non-empty array', {
        status: 400,
      });
    }

    if (!maxResults || maxResults < 1) {
      return new Response(
        'Error: maxResults must be a number greater than 0',
        { status: 400 }
      );
    }

    const searchResults = await searchFileChunks({
      searchQuery,
      files: files as FileLite[],
      maxResults,
    });

    return new Response(JSON.stringify({ searchResults }), { status: 200 });
  } catch (error) {
    console.error(error);
    const err = error as Error & { code?: string; message?: string };
    return new Response('Error', {
      status: 500,
      statusText: err.message || 'Something went wrong',
    });
  }
}

