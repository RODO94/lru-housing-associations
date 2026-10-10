import z from "zod";

export const govUKAttachmentSchema = z.object({
  title: z.string(),
  url: z.string(),
  attachment_type: z.string(),
  content_type: z.string().nullish(),
});

export const govUKPublicationSchema = z.object({
  details: z.object({
    attachments: z.array(govUKAttachmentSchema),
  }),
});
