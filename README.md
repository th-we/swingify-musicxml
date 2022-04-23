# Swingify MusicXML

Manipulates `<duration>` and `<divisions>` elements of MuiscXML files so that any (quarter) beat starting with an eighth note is transformed to ternary (triplet) rhythms.

The result is targeted towards playback-oriented applications and might not be properly import into all MusicXML applications (specifically not notation-oriented ones).

## Installation

```sh
git clone https://github.com/th-we/swingify-musicxml
cd swingify-musicxml
npm install
```

## Usage

```sh
npx ts-node src/bin/index.ts input.musicxml > output.musicxml
```

For more information:

```sh
npx ts-node src/bin/index.ts --help
```

(Pull requests for making swingify-musicxml properly installable welcome.)

## Color flags

Colored notes are treated specially. If a beat starts with a red note (`#FF0000`), the beat is not swingified. Blue notes (`#0000FF`) are silenced. For how to override this, see the respective command line options.