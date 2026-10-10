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

/** One row of the RSH "List of registered providers" spreadsheet, as parsed. */
export const rshProviderRowSchema = z.object({
  "Organisation name": z.string().min(1),
  "Registration number": z.string().min(1),
  "Registration date": z.iso.date(),
  Designation: z.enum(["Non-profit", "Profit", "Local authority"]),
  "Corporate form": z.string(),
  Notes: z.string(),
});

export const rshProviderArraySchema = z.array(rshProviderRowSchema);

/** A provider as saved to `data/json/rsh_providers_<as_at>.json`. */
export const savedRshProviderSchema = z.object({
  orgName: z.string().min(1),
  registrationNumber: z.string().min(1),
  registrationDate: z.iso.date(),
  designation: rshProviderRowSchema.shape.Designation,
  corporateForm: z.string(),
  notes: z.string(),
});

export const savedRshProviderArraySchema = z.array(savedRshProviderSchema);

export type SavedRshProvider = z.infer<typeof savedRshProviderSchema>;
