import { supabase } from "./supabase";

type LeafyChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type LeafyChatResponse = {
  answer: string;
};

async function getFunctionErrorMessage(error: unknown) {
  const context = typeof error === "object" && error !== null && "context" in error ? (error as { context?: unknown }).context : null;

  if (context instanceof Response) {
    try {
      const body = (await context.json()) as { error?: unknown };
      if (typeof body.error === "string") return body.error;
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  return error instanceof Error ? error.message : "Leafy AI failed.";
}

export async function generateLeafyChatResponse(message: string, history: LeafyChatMessage[]) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.functions.invoke<LeafyChatResponse>("leafy-chat", {
    body: {
      message,
      history,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data?.answer) {
    throw new Error("Leafy AI did not return a response.");
  }

  return data.answer;
}
