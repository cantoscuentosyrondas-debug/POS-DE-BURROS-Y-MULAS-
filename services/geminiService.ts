
import { GoogleGenAI } from "@google/genai";
import { Product, Order } from "../types";

export const getSmartSuggestions = async (orders: Order[], products: Product[]) => {
  // Initialize right before use to ensure the latest API key from process.env.API_KEY is used as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Based on the following restaurant data, suggest 3 improvements:
    Products: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock })))}
    Recent Orders: ${JSON.stringify(orders.slice(-10).map(o => ({ total: o.total, items: o.items })))}
    
    Return 3 bullet points in Spanish about:
    1. Inventory warning
    2. Suggested daily special
    3. Customer trend
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correctly accessing .text property (not a method) as per guidelines
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI suggestions.";
  }
};

export const generateChefDescription = async (product: Product) => {
  // Initialize right before use to ensure the latest API key from process.env.API_KEY is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Create a gourmet description in Spanish for a dish named "${product.name}" which is described as "${product.description}". Keep it short and enticing (max 30 words).`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correctly accessing .text property
    return response.text;
  } catch (error) {
    return product.description;
  }
};
