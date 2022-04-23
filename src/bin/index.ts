const { Command } = require("commander");
// import Command from "commander";
import swinginfy, { Options } from "../lib/swingify";
import fs from "fs";
import { JSDOM } from "jsdom";

let options;
let musicxmlPath = "";

new Command()
  .name("swingify-musicxml")
  .option(
    "--skipColor <string>",
    "A hex color string, or 'NONE'. Groups of notes will not be swingified if a note(head) on the beat matches this color. If 'NONE' is set, all groups will be swingified, if possible. Default is '#FF0000' (red)."
  )
  .option(
    "--silenceColor <string>",
    "A hex color string, or 'NONE'. Notes with the given color will be silenced. If 'NONE' is set, no notes will be silenced. Default is #0000FF (blue)."
  )
  .arguments("<musicxml>")
  .description(
    [
      "Swingifies the musicxml input and prints the resulting XML to stdout.",
      "<duration> and <divisions> elements are manipulated so that any beat starting with an eighth note is transformed to ternary (triplet) rhythms.",
      "The result is targeted towards playback-oriented applications and might not be properly importable by all MusicXML applications (specifically not notation-oriented ones).",
      "Colored notes are treated specially. If a beat starts with a red note (#FF0000), the beat is not swingified. Blue notes (#0000FF) are silenced. For how to override this, see the respective command line options.",
    ].join("\n\n")
  )
  .action((...args: [string, Options]) => {
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
