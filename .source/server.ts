// @ts-nocheck
import * as __fd_glob_0 from "../src/app/(docs)/_content/index.mdx?collection=docs";
import { server } from "fumadocs-mdx/runtime/server";
import type * as Config from "../source.config";

const create = server<
  typeof Config,
  import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
    DocData: {};
  }
>({ doc: { passthroughs: ["extractedReferences"] } });

export const docs = await create.docs(
  "docs",
  "src/app/(docs)/_content",
  {},
  { "index.mdx": __fd_glob_0 },
);
