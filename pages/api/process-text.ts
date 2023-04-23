import type { NextApiRequest, NextApiResponse } from 'next';
import { TextEmbedding } from '../../types/file';
import { createEmbeddings } from '../../services/createEmbeddings';
import multiparty from 'multiparty';

type Fields = { [key: string]: string[] };
type Files = { [key: string]: multiparty.File[] };

// Disable the default body parser to handle file uploads
export const config = { api: { bodyParser: false } };

type Data = {
  text?: string;
  meanEmbedding?: number[];
  chunks?: TextEmbedding[];
  error?: string;
};

// This function receives a file as a multipart form and returns the text extracted from the file and the OpenAI embedding for that text
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, files } = await new Promise<{
      fields: Fields;
      files: Files;
    }>((resolve, reject) => {
      const form = new multiparty.Form();

      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files } as { fields: Fields; files: Files });
        }
      });
    });

    const text = fields.text?.[0]; // Assuming the text field is named 'text'

    if (!text) {
      res.status(400).json({ error: 'Text field is missing' });
      return;
    }

    const { meanEmbedding, chunks } = await createEmbeddings({ text });

    res.status(200).json({ meanEmbedding, chunks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    // Always send a response, even if it is empty
    res.end();
  }
}
