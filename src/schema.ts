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

export type RshProviderRow = z.infer<typeof rshProviderRowSchema>;

/** Designation after normalisation; matches `Entity.designation` in the plan. */
export const rshDesignationSchema = z.enum([
  "non-profit",
  "for-profit",
  "local-authority",
]);

export type RshDesignation = z.infer<typeof rshDesignationSchema>;

/** A provider as saved to `data/json/rsh_providers_<as_at>.json`. */
export const savedRshProviderSchema = z.object({
  orgName: z.string().min(1),
  registrationNumber: z.string().min(1),
  registrationDate: z.iso.date(),
  designation: rshDesignationSchema,
  corporateForm: z.string(),
  notes: z.string(),
});

export const savedRshProviderArraySchema = z.array(savedRshProviderSchema);

export type SavedRshProvider = z.infer<typeof savedRshProviderSchema>;
