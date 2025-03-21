
import c from "config";
import fs from "fs";
import {generateConfig} from "./generators.js";

const sites = c.sites;
const config = generateConfig(sites);

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));

console.log("config.json generated successfully");
