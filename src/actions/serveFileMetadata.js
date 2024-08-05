import { Untar } from "./Untar.js";
import { getPackage } from "../utils/npm.js";
import { fileMetadata } from "./fileMetadata.js";

export async function serveFileMetadata(c) {
  const stream = await getPackage(c.var.packageName, c.var.packageVersion);
  const extractor = new Untar(stream);
  const file = extractor.getFile(c.var.filename);
  if (file) {
    return c.json(await fileMetadata(file));
  }
}
