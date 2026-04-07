import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const builds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/builds' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    intro: z.string().optional().default(''),
    specs: z.array(z.string()).optional().default([]),
    callouts: z
      .array(
        z.object({
          heading: z.string(),
          text: z.string(),
          image: z
            .object({
              src: z.string(),
              alt: z.string().optional().default(''),
            })
            .optional(),
        })
      )
      .optional()
      .default([]),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string().optional().default(''),
        })
      )
      .optional()
      .default([]),
    sourcePath: z.string().optional(),
    featured: z.boolean().optional().default(false),
    order: z.number().optional().default(999),
  }),
});

export const collections = { builds };

