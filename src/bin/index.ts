const { Command } = require("commander");
// import Command from "commander";
import swinginfy, { Options } from "../lib/swing";
import fs from "fs";
import { JSDOM } from "jsdom";

let options;
let musicxmlPath = "";

new Command()
  .option(
    "--skipColor <string>",
    "Can be 'any' or a color string like '#ff0000'. Groups of notes will note be swingified if a note(head) on the beat matches this color or is any non-black color when 'any' is used."
  )
  .arguments("<musicxml>")
  .description(
    "Swingifies the musicxml input and prints the resulting XML to stdout."
  )
  .action((...args: [string, { skipColor?: string }]) => {
    [musicxmlPath, options] = args;
  })
  .parse();

let musicxmlString;
try {
  musicxmlString = fs.readFileSync(musicxmlPath).toString();
} catch (e: any) {
  throw new Error(`Could not read file ${musicxmlPath}\n\n${e.message}`);
}

const { DOMParser, XMLSerializer } = new JSDOM("").window;
const document = new DOMParser().parseFromString(
  musicxmlString,
  "application/xml"
);
swinginfy(document, options);
console.log(new XMLSerializer().serializeToString(document));
