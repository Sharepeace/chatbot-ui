import { IncomingMessage } from "http";
import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  CreateChatCompletionResponse,
  CreateCompletionRequest,
  OpenAIApi,
} from "openai";
import Bottleneck from "bottleneck";

// Configure the rate limiter
const limiter = new Bottleneck({
  minTime: 250, // Minimum time (in ms) between each request, adjust as needed
  maxConcurrent: 1, // Maximum number of concurrent requests, adjust as needed
});

// This file contains utility functions for interacting with the OpenAI API

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
export const openai = new OpenAIApi(configuration);

type CompletionOptions = Partial<CreateCompletionRequest> & {
  prompt: string;
  fallback?: string;
};

type EmbeddingOptions = {
  fileName: string;
  input: string | string[];
  model?: string;
};

export async function completion(options: CompletionOptions) {
  console.log("Calling completion with options:");

  return limiter.schedule(() => _completion(options));
}

export async function _completion({
  prompt,
  fallback,
  max_tokens,
  temperature = 0,
  model = "gpt-3.5-turbo", // use gpt-4 for better results
}: CompletionOptions) {
  console.log("Entering _completion function with options:");
  try {
    // Note: this is not the proper way to use the ChatGPT conversational format, but it works for now
    const messages = [
      {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: prompt ?? "",
      },
    ];

    const result = await openai.createChatCompletion({
      model,
      messages,
      temperature,
      max_tokens: max_tokens ?? 4000,
    });
    console.log("Received result from API _completion:");

    if (!result.data.choices[0].message) {
      throw new Error("No text returned from completions endpoint");
    }
    return result.data.choices[0].message.content;
  } catch (error) {
    console.error("Error in _completion:", error);
    if (fallback) return fallback;
    else throw error;
  }
}

export async function* completionStream({
  prompt,
  fallback,
  max_tokens = 4000,
  temperature = 0,
  model = "gpt-3.5-turbo", // use gpt-4 for better results
}: CompletionOptions) {
  console.log("Entering completionStream function with options:");
  try {
    // Note: this is not the proper way to use the ChatGPT conversational format, but it works for now
    const messages = [
      {
        role: ChatCompletionRequestMessageRoleEnum.System,
        content: prompt ?? "",
      },
    ];

    const result = await openai.createChatCompletion(
      {
        model,
        messages,
        temperature,
        max_tokens: max_tokens ?? 800,
        stream: true,
      },
      {
        responseType: "stream",
      }
    );
    const stream = result.data as any as IncomingMessage;

    let buffer = "";
    const textDecoder = new TextDecoder();
    console.log("Entering completionStream loop");

    for await (const chunk of stream) {
      buffer += textDecoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");

      // Check if the last line is complete
      if (buffer.endsWith("\n")) {
        buffer = "";
      } else {
        buffer = lines.pop() || "";
      }

      for (const line of lines) {
        const message = line.trim().split("data: ")[1];
        if (message === "[DONE]") {
          console.log("completionStream finished");
          break;
        }

        // Check if the message is not undefined and a valid JSON string
        if (message) {
          try {
            const data = JSON.parse(message) as CreateChatCompletionResponse;
            // @ts-ignore
            if (data.choices[0].delta?.content) {
              // @ts-ignore
              yield data.choices[0].delta?.content;
            }
          } catch (error) {
            console.error("Error parsing JSON message:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in completionStream:", error);
    if (fallback) yield fallback;
    else throw error;
  }
}

export async function embedding(options: EmbeddingOptions): Promise<number[][]> {
  // console.log("Calling embedding with options: ", options.fileName);
  return limiter.schedule(() => _embedding(options));
}

export async function _embedding({
  fileName,
  input,
  model = "text-embedding-ada-002",
}: EmbeddingOptions): Promise<number[][]> {
  // console.log("Entering _embedding function with options: ",fileName);
  const result = await openai.createEmbedding({
    model,
    input,
  },
  {
    timeout: 60000, // Add this line to set a 60 seconds timeout
  });
  // console.log("Received result from API _embedding:");

  if (!result.data.data[0].embedding) {
    throw new Error("No embedding returned from the completions endpoint");
  }

  // Otherwise, return the embeddings
  return result.data.data.map((d) => d.embedding);
}
