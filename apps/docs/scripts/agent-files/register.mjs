// Registers the module hooks in ts-source-hooks.mjs; import this file before loading any of the components package's sources.
import { register } from "node:module";
register("./ts-source-hooks.mjs", import.meta.url);
