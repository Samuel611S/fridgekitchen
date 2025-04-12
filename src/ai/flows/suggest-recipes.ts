'use server';

/**
 * @fileOverview Recipe suggestion flow based on available ingredients.
 *
 * - suggestRecipes - A function that suggests recipes based on ingredients.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - SuggestRecipesOutput - The return type for the suggestRecipes function.
 */

import {ai} from '@/ai/ai-instance';
import {translateText} from '@/ai/translate-tool';
import {z} from 'genkit';

const SuggestRecipesInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients the user has available.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language to use for the recipe suggestions.'),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

const SuggestRecipesOutputSchema = z.object({
  recipes: z.array(
    z.object({
      name: z.string().describe('The name of the recipe.'),
      ingredients: z.array(z.string()).describe('The ingredients required for the recipe.'),
      instructions: z.string().describe('The step-by-step instructions for the recipe.'),
    })
  ).describe('A list of suggested recipes based on the available ingredients.'),
});
export type SuggestRecipesOutput = z.infer<typeof SuggestRecipesOutputSchema>;

export async function suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput> {
  return suggestRecipesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipesPrompt',
  input: {
    schema: z.object({
      ingredients: z
        .array(z.string())
        .describe('A list of ingredients the user has available.'),
    }),
  },
  output: {
    schema: z.object({
      recipes: z.array(
        z.object({
          name: z.string().describe('The name of the recipe.'),
          ingredients: z.array(z.string()).describe('The ingredients required for the recipe.'),
          instructions: z.string().describe('The step-by-step instructions for the recipe.'),
        })
      ).describe('A list of suggested recipes based on the available ingredients.'),
    }),
  },
  prompt: `You are a recipe suggestion assistant. The user will provide you with a list of ingredients they have available, and you will suggest recipes that can be made with those ingredients.

  Available ingredients:
  {{#each ingredients}}
  - {{{this}}}
  {{/each}}

  Suggest recipes that primarily use the available ingredients, but may also include common ingredients that most people have (such as salt, pepper, oil).
  The recipes should be easy to follow.
  Format each recipe with the name, a list of ingredients, and step-by-step instructions.
  Return multiple recipe suggestions.
  `,
});

const suggestRecipesFlow = ai.defineFlow<
  typeof SuggestRecipesInputSchema,
  typeof SuggestRecipesOutputSchema
>({
  name: 'suggestRecipesFlow',
  inputSchema: SuggestRecipesInputSchema,
  outputSchema: SuggestRecipesOutputSchema,
}, async input => {
  const {language, ...rest} = input;

  let translatedPrompt = prompt;
  if (language === 'ar') {
    const translatedPromptText = await translateText({
      targetLanguage: 'ar',
      text: prompt.prompt,
    });
    translatedPrompt = ai.definePrompt({
      name: 'suggestRecipesPromptAr',
      input: prompt.input,
      output: prompt.output,
      prompt: translatedPromptText,
    });
  }
  const {output} = await translatedPrompt(rest);
  return output!;
});
