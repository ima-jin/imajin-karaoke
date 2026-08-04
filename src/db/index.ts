import { createDb } from "@ima-jin/db";
import * as schema from "./schema";

export const db = createDb(schema);
export * from "./schema";
