// Use server directive is required for Genkit flows.
'use server';

/**
 * @fileOverview Recipe suggestion flow based on available ingredients.
 *
 * - suggestRecipes - A function that suggests recipes based on ingredients.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - SuggestRecipesOutput - The return type for the suggestRecipes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestRecipesInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients the user has available.'),
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
  prompt: `أنت مساعد اقتراحات وصفات. سيزودك المستخدم بقائمة بالمكونات المتوفرة لديه، وسوف تقترح وصفات يمكن تحضيرها بهذه المكونات.

  المكونات المتوفرة:
  {{#each ingredients}}
  - {{{this}}}
  {{/each}}

  اقترح وصفات تستخدم بشكل أساسي المكونات المتوفرة، ولكن يمكن أن تشمل أيضًا المكونات الشائعة المتوفرة لدى معظم الناس (مثل الملح والفلفل والزيت).
  يجب أن تكون الوصفات سهلة الاتباع.
  قم بتنسيق كل وصفة بالاسم وقائمة المكونات والتعليمات خطوة بخطوة.
  أرجع اقتراحات متعددة للوصفات.
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
  const {output} = await prompt(input);
  return output!;
});


