import { AtomsClient, Configuration } from "smallestai";

const config = new Configuration({
  accessToken: process.env.SMALLEST_API_KEY,
});

export const atomsClient = new AtomsClient(config);
