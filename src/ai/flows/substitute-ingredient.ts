// substitute-ingredient.ts
'use server';

/**
 * @fileOverview Ingredient substitution AI agent.
 *
 * - substituteIngredient - A function that suggests ingredient substitutions.
 * - SubstituteIngredientInput - The input type for the substituteIngredient function.
 * - SubstituteIngredientOutput - The return type for the substituteIngredient function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SubstituteIngredientInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  originalIngredient: z.string().describe('The ingredient to be substituted.'),
  availableIngredients: z
    .string()
    .array()
    .describe('The ingredients that the user has available.'),
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
  prompt: `أنت شيف تساعد المستخدم في العثور على بديل لمكون في الوصفة.

المستخدم مفقود المكون "{{{originalIngredient}}}" من الوصفة "{{{recipeName}}}".

المستخدم لديه المكونات التالية المتاحة: {{{availableIngredients}}}.

اقترح بدائل للمكون المفقود، مع الأخذ في الاعتبار الوصفة والمكونات المتاحة.
اشرح أسبابك لكل بديل مقترح.`,
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
    const {output} = await prompt(input);
    return output!;
  }
);
