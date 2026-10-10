import { parseArgs } from "node:util";

import { fetchGovUKTest, fetchGovUKURL } from "./fetching/gov-uk-content.ts";
import { govUKPublicationSchema } from "./schema.ts";

const { values } = parseArgs({
  options: {
    name: { type: "string", short: "n", default: "world" },
  },
});

console.log(`Hello, ${values.name}!`);

const result = await fetchGovUKTest("registered");

if (result) {
  const jsonResponse = await result.json();

  const publication = govUKPublicationSchema.safeParse(jsonResponse);

  if (publication.error) {
    console.error("Issue with zod parsing");
    console.error(publication.error);
  } else {
    const [file] = publication.data.details.attachments.filter(
      (attachment) => attachment.attachment_type === "file",
    );

    if (file) {
      await fetchGovUKURL(file);
    }
  }
}
