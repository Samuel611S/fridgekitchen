// substitute-ingredient.ts
'use server';

/**
 * @fileOverview Ingredient substitution AI agent.
 *
 * - substituteIngredient - A function that suggests ingredient substitutions.
 * - SubstituteIngredientInput - The input type for the substituteIngredient function.
 * - SubstituteIngredientOutput - The return type for the SubstituteIngredient function.
 */

import {ai} from '@/ai/ai-instance';
import {translateText} from '@/ai/translate-tool';
import {z} from 'genkit';

const SubstituteIngredientInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  originalIngredient: z.string().describe('The ingredient to be substituted.'),
  availableIngredients: z
    .string()
    .array()
    .describe('The ingredients that the user has available.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language to use for the recipe suggestions.'),
});
export type SubstituteIngredientInput = z.infer<
  typeof SubstituteIngredientInputSchema
>;

const SubstituteIngredientOutputSchema = z.object({
  suggestedSubstitutes: z
    .string()
    .array()
    .describe('Suggested substitutes for the original ingredient.'),
  reasoning: z
    .string()
    .describe(
      'Explanation of why these substitutes are appropriate, considering the recipe and available ingredients.'
    ),
});
export type SubstituteIngredientOutput = z.infer<
  typeof SubstituteIngredientOutputSchema
>;

export async function substituteIngredient(
  input: SubstituteIngredientInput
): Promise<SubstituteIngredientOutput> {
  return substituteIngredientFlow(input);
}

const prompt = ai.definePrompt({
  name: 'substituteIngredientPrompt',
  input: {
    schema: z.object({
      recipeName: z.string().describe('The name of the recipe.'),
      originalIngredient: z.string().describe('The ingredient to be substituted.'),
      availableIngredients: z
        .string()
        .array()
        .describe('The ingredients that the user has available.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedSubstitutes: z
        .string()
        .array()
        .describe('Suggested substitutes for the original ingredient.'),
      reasoning: z
        .string()
        .describe(
          'Explanation of why these substitutes are appropriate, considering the recipe and available ingredients.'
        ),
    }),
  },
  prompt: `You are a chef helping a user find a substitute for an ingredient in a recipe.

The user is missing the ingredient "{{{originalIngredient}}}" from the recipe "{{{recipeName}}}".

The user has the following ingredients available: {{{availableIngredients}}}.

Suggest substitutes for the missing ingredient, taking into account the recipe and available ingredients.
Explain your reasoning for each suggested substitute.`,
});

const substituteIngredientFlow = ai.defineFlow<
  typeof SubstituteIngredientInputSchema,
  typeof SubstituteIngredientOutputSchema
>({
  name: 'substituteIngredientFlow',
  inputSchema: SubstituteIngredientInputSchema,
  outputSchema: SubstituteIngredientOutputSchema,
},
  async input => {
    const {language, ...rest} = input;
    let translatedPrompt = prompt;
    if (language === 'ar') {
      const translatedPromptText = await translateText({
        targetLanguage: 'ar',
        text: prompt.prompt,
      });
      translatedPrompt = ai.definePrompt({
        name: 'substituteIngredientPromptAr',
        input: prompt.input,
        output: prompt.output,
        prompt: translatedPromptText,
      });
    }
    const {output} = await translatedPrompt(rest);
    return output!;
  }
);
