'use server';
/**
 * @fileOverview A tool to translate text.
 *
 * - translateText - A function that translates text from one language to another.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language for the translation.'),
});

const TranslateTextOutputSchema = z.string().describe('The translated text.');

export const translateText = ai.defineTool(
  {
    name: 'translateText',
    description: 'Translates text from one language to another.',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    // This can call any typescript function.
    const prompt = ai.definePrompt({
      name: 'translatePrompt',
      input: {
        schema: z.object({
          text: z.string().describe('The text to translate.'),
          targetLanguage: z.string().describe('The target language for the translation.'),
        }),
      },
      output: {
        schema: z.object({
          translatedText: z.string().describe('The translated text.'),
        }),
      },
      prompt: `Translate the following text to {{targetLanguage}}:

      {{{text}}}
      `,
    });
    const {output} = await prompt(input);
    return output!.translatedText;
  }
);
