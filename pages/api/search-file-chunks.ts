import { NextApiRequest } from 'next';

import { searchFileChunks } from "../../services/searchFileChunks";
import { FileChunk, FileLite } from "../../types/file";

type Data = {
  searchResults?: FileChunk[];
  error?: string;
};

export const config = {
  // runtime: 'edge',
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

const handler = async (req: NextApiRequest): Promise<Response> => {
  try {
    console.log('search-file-chunks handler called');
    const searchQuery = req.body.searchQuery as string;

    const files = req.body.files as FileLite[];
    
    const maxResults = req.body.maxResults as number;

    if (!searchQuery || typeof searchQuery !== 'string') {
      const errorMessage = 'Error: searchQuery must be a string';
      console.error(errorMessage);
      return new Response(errorMessage, {
        status: 400,
      });
    }

    if (!Array.isArray(files) || files.length === 0) {
      const errorMessage = 'Error: files must be a non-empty array';
      console.error(errorMessage);
      return new Response(errorMessage, {
        status: 400,
      });
    }

    if (!maxResults || maxResults < 1) {
      const errorMessage = 'Error: maxResults must be a number greater than 0';
      console.error(errorMessage);
      return new Response(errorMessage, { status: 400 });
    }

    const searchResults = await searchFileChunks({
      searchQuery,
      files,
      maxResults,
    });

    if (searchResults === undefined) {
      const errorMessage = 'Error: searchResults must be defined';
      console.error(errorMessage);
      return new Response(errorMessage, {
        status: 500,
      });
    }
    
    const responseBody = {
      searchResults: searchResults,
    };
    
    return new Response(JSON.stringify(responseBody), { status: 200 });
  } catch (error) {
    console.error(error);
    const err = error as Error & { code?: string; message?: string };
    return new Response('Error', {
      status: 500,
      statusText: err.message || 'Something went wrong',
    });
  }
}
export default handler;
