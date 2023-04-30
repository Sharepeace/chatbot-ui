import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
import { FileChunk, ScrapeDataType } from '@/types/file'

export const config = {
  runtime: 'edge',
};
const MAX_FILES_LENGTH = 2000 * 3;
const MAX_FILE_CHUNKS_TOKENS = 2000; // Set a limit for file chunks tokens

const handler = async (req: Request): Promise<Response> => {

  try {
    const { model, messages, key, prompt, temperature, fileChunk } = (await req.json()) as ChatBody;

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt || DEFAULT_SYSTEM_PROMPT;
    const temperatureToUse = temperature ?? DEFAULT_TEMPERATURE;

    let fileChunksTokens = 0;
    let filesString = '';

    if (fileChunk.length > 0) {
      const fileChunks = fileChunk as ScrapeDataType[];
      filesString = fileChunks
        .map((fileChunk) => {
          const fileContent = `###\n\"${fileChunk.file_name}\"\n${fileChunk.content}`;
          const tokens = encoding.encode(fileContent);
          if (fileChunksTokens + tokens.length <= MAX_FILE_CHUNKS_TOKENS) {
            fileChunksTokens += tokens.length;
            return fileContent;
          }
          return null;
        })
        .filter(Boolean)
        .join("\n")
        .slice(0, MAX_FILES_LENGTH);
      promptToSend = `Given the git repository context: ${filesString}.\n\n You are an all star programmer, answer the following questions as best as you can.`;
    }

    const prompt_tokens = encoding.encode(promptToSend);
    let tokenCount = prompt_tokens.length + fileChunksTokens;

    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length > model.tokenLimit - 1000) {
        continue;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    encoding.free();

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, key, messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
