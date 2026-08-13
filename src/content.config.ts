import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const requirementSchema = z.object({
  name: z.string(),
  note: z.string(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        contentType: z
          .enum(['home', 'docs', 'blog-index', 'blog-post', 'changelog-index', 'changelog-release'])
          .optional(),
        date: z.coerce.date().optional(),
        author: z.string().optional(),
        role: z.string().optional(),
        tags: z.array(z.string()).optional(),
        versions: z.array(z.string()).optional(),
        summary: z.string().optional(),
        appliesTo: z.string().optional(),
        version: z.string().optional(),
        line: z.string().optional(),
        channel: z.enum(['stable', 'beta']).optional(),
        breaking: z.boolean().optional().default(false),
        requires: z.array(requirementSchema).optional().default([]),
        range: z.string().optional(),
        commits: z.number().int().positive().optional(),
        refs: z.array(z.string()).optional().default([]),
      }),
    }),
  }),
};
