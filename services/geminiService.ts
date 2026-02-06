
import { GoogleGenAI, Type } from "@google/genai";

interface GeneratedWord {
  word: string;
  ipa: string;
  definition: string;
  example: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const wordListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      word: {
        type: Type.STRING,
        description: "The English word.",
      },
      ipa: {
        type: Type.STRING,
        description: "The International Phonetic Alphabet (IPA) transcription of the word.",
      },
      definition: {
        type: Type.STRING,
        description: "A concise definition of the word in simple English.",
      },
      example: {
        type: Type.STRING,
        description: "An example sentence using the word.",
      },
    },
    required: ["word", "ipa", "definition", "example"],
  },
};

export const generateVocabularyList = async (category: string, count: number = 20): Promise<GeneratedWord[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of ${count} essential English vocabulary words for the category: "${category}". Provide the word, its IPA transcription, a simple definition, and an example sentence for each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: wordListSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from API");
    }

    const parsed = JSON.parse(jsonText);
    return parsed as GeneratedWord[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate vocabulary list from Gemini API.");
  }
};
