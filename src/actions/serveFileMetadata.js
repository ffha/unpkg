import { Untar } from "./Untar";
import { getPackage } from "../utils/npm.js";
import { fileMetadata } from "./fileMetadata.js";

export async function serveFileMetadata(c) {
  const stream = await getPackage(c.req.packageName, c.req.packageVersion);
  const extractor = new Untar(stream);
  const file = extractor.getFile(c.req.filename);
  if (file) {
    return c.json(await fileMetadata(file));
  }
}
