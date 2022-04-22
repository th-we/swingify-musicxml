export type Options = {
  noswingColor?: string;
  silenceColor?: string;
};

enum Flag {
  SILENCE,
  NOSWING,
}

const validRestChildren = new Set(["duration", "notations", "type", "voice"]);

function throwError(message: string, element: Element): never {
  const measure = element.closest("measure");
  const measureInfo = !measure
    ? ""
    : ` in part ${measure.parentElement?.getAttribute("id")} measure ${
        measure.getAttribute("number") || ""
      }`;
  throw new Error(message + measureInfo);
}

/**
 * Returns the divisions value that is currently active in the measure. Throws
 * an error if there is no active divisions value. Also modifies the <divisions>
 * element by tripling its value because in the output, we triple all the values
 * so the integer math still works with ternary rhythms. The returned value is
 * however the original value as read from the <divisions> element.
 *
 * @param unswingedDivisions  Divisions value that was used in the preceding
 * measure. Unless this measure has a <division> element of its own, the
 * previously active (unswinged) divisions as read from the MusicXML remains
 * active and will be returned.
 */
function updateDivisions(measure: Element, unswingedDivisions?: number) {
  const divisionsElement = measure.querySelector("attributes > divisions");

  if (divisionsElement) {
    const value = parseIntOrThrow(divisionsElement);
    divisionsElement.textContent = (value * 3).toString();
    return value;
  }

  if (!unswingedDivisions) {
    throwError("No divisions defined", measure);
  }

  return unswingedDivisions;
}

function parseIntOrThrow(element: Element) {
  const stringValue = element.textContent || "";
  const value = parseInt(stringValue);
  if (isNaN(value)) {
    throwError(
      `<${element.localName}> value mut be an integer, but found "${stringValue}"`,
      element
    );
  }
  return value;
}

/**
 * Makes sure that there are no unsupported elements present (namely <backup>
 * and <forward>).  Will throw an error otherwise.d
 */
function checkMeasure(measure: Element) {
  for (const unsupportedElement of measure.querySelectorAll(
    "backup, forward"
  )) {
    throwError(
      `<${unsupportedElement.localName}> is not currently supported but is present`,
      measure
    );
  }
}

/**
 * Splits up the duration of the note at the beats of the measure with beat
 * units being of the duration specified by `divisions`.
 *
 * @param divisions The unit for a quarter note
 * @param start The current position in the measure, in `divisions` units
 * @param duration The duration of the note we want to produce the duration
 * components for.
 * @returns An array with three components. Here are some examples. `divisions`
 * is always assumed to be 8. The diagram uses 0, 1 and 2 to illustrate which
 * component of the returned array a portion of the duration belongs to.
 *
 * ```
 * start duration   beat/duration diagram               result
 *                  1       2       3       4
 *                  |       |       |       |       |
 *   0     4        2222                                 [ 0  0 4 ]
 *   4     8            00002222                         [ 4  0 4 ]
 *  12     2                    11                       [ 0  2 0 ]
 *  14     2                      00                     [ 2  0 0 ]
 *  16    12                        111111112222         [ 0  8 4 ]
 *  28     4                                    0000     [ 4  0 0 ]
 *   0     8        11111111                             [ 0  8 0 ]
 *   8     16               1111111111111111             [ 0 16 0 ]
 *  24     8                                11111111     [ 0  8 0 ]
 *   0     4        2222                                 [ 0  0 4 ]
 *   4     24           000011111111111111112222         [ 4 16 4 ]
 *  28     4                                    0000     [ 4  0 0 ]
 * ```
 * This means component 0 is only set if the note does not start on a beat and
 * component 2 is only set if the note does not end on a beat. Component 1
 * includes everything from the first to the last beat encompassed by the note.
 */
function durationComponents(
  divisions: number,
  start: number,
  duration: number
): [number, number, number] {
  const beatToStart = start % divisions;

  let startToBeat = beatToStart === 0 ? 0 : divisions - beatToStart;
  if (startToBeat > duration) {
    startToBeat = 0;
  }

  let beatToEnd = (start + duration) % divisions;
  if (beatToEnd > duration) {
    beatToEnd = 0;
  }

  return [startToBeat, duration - startToBeat - beatToEnd, beatToEnd];
}

function isFollowupChordNote(
  note: Element,
  unswingedDuration: number,
  precedingUnswingedDuration: number
) {
  if (!note.querySelector("chord")) {
    return false;
  }

  if (unswingedDuration === precedingUnswingedDuration) {
    return true;
  }

  if (!precedingUnswingedDuration) {
    throwError(`Found chord note without preceding main chord note`, note);
  }

  throwError(
    `Chord notes must all be the same duration, but found durations ${precedingUnswingedDuration} and ${unswingedDuration}`,
    note
  );
}

function flagFromNoteColor(note: Element, options: Options) {
  const noteColor = (
    note.getAttribute("color") ||
    note.querySelector("notehead")?.getAttribute("color")
  )?.toUpperCase();

  switch (noteColor) {
    case options.noswingColor:
      return Flag.NOSWING;
    case options.silenceColor:
      return Flag.SILENCE;
  }
}

function calcSwingedDuration(
  divisions: number,
  unswingedPosition: number,
  unswingedDuration: number,
  makeBeatSwing: boolean,
  options: Options,
  flag?: Flag
) {
  const [startToBeat, betweenBeats, beatToEnd] = durationComponents(
    divisions,
    unswingedPosition,
    unswingedDuration
  );

  let swingedDuration = startToBeat * (makeBeatSwing ? 2 : 3);
  if (betweenBeats % divisions === 0) {
    // the betweenBeats duration component stretches from beat to beat
    swingedDuration += betweenBeats * 3;
  } else {
    // the betweenBeats duration component neither starts nor ends on a
    // beat
    swingedDuration += betweenBeats * (makeBeatSwing ? 2 : 3);
  }

  // Check if we're starting a new beat here
  if (beatToEnd > 0) {
    // We only want to make this beat swing if it starts with an eighth
    makeBeatSwing = flag !== Flag.NOSWING && beatToEnd === divisions / 2;
  }

  swingedDuration += beatToEnd * (makeBeatSwing ? 4 : 3);

  return [swingedDuration, makeBeatSwing] as [number, boolean];
}

/**
 * Checks if values for options are valid and sets defaults.
 */
function normalizeOptions(options?: Options) {
  options = Object.assign(
    {
      noswingColor: "#FF0000",
      silenceColor: "#0000FF",
    },
    options || {}
  );

  for (const [option, value] of Object.entries(options)) {
    switch (option) {
      case "noswingColor":
      case "silenceColor":
        options[option] = value.toUpperCase();
        if (!options[option]!.match(/NONE|#[0-9A-F]{6}/)) {
          throw new Error(
            `Value for option ${option} must be a 6-digit hex color or 'NONE', but it is '${value}'`
          );
        }
    }
  }

  if (options.noswingColor === options.silenceColor) {
    throw new Error(
      "Options 'noswingColor' and 'silenceColor' must have different values."
    );
  }

  return options;
}

export default function swingify(document: Document, options?: Options) {
  options = normalizeOptions(options);

  for (const part of document.querySelectorAll("score-partwise > part")) {
    let divisions = undefined;
    for (const measure of part.querySelectorAll("measure")) {
      checkMeasure(measure);
      divisions = updateDivisions(measure, divisions);

      let unswingedPosition = 0;
      let swingedPosition = 0;

      let makeBeatSwing = false;

      let precedingUnswingedDuration = 0;
      let swingedDuration = 0;

      for (const note of measure.querySelectorAll("note")) {
        const durationElement = note.querySelector("duration");
        if (!durationElement) {
          throwError("<duration> element missing on note", note);
        }
        const unswingedDuration = parseIntOrThrow(durationElement);
        const flag = flagFromNoteColor(note, options);

        if (
          !isFollowupChordNote(
            note,
            unswingedDuration,
            precedingUnswingedDuration
          )
        ) {
          [swingedDuration, makeBeatSwing] = calcSwingedDuration(
            divisions,
            unswingedPosition,
            unswingedDuration,
            makeBeatSwing,
            options,
            flag
          );

          unswingedPosition = unswingedPosition + unswingedDuration;
          swingedPosition = swingedPosition + swingedDuration;

          precedingUnswingedDuration = unswingedDuration;
        }

        durationElement.textContent = swingedDuration.toString();

        if (flag === Flag.SILENCE) {
          if (note.querySelector("chord")) {
            note.parentElement!.removeChild(note);
          } else {
            [...note.childNodes]
              .filter((child) => !validRestChildren.has(child.nodeName))
              .forEach((child) => child.parentElement!.removeChild(child));
            const rest = note.ownerDocument.createElement("rest");
            note.insertAdjacentElement("afterbegin", rest);
          }
        }
      }

      if (unswingedPosition * 3 !== swingedPosition) {
        throwError(
          `Faulty processing: Modified durations don't add up properly (expected duration sum ${
            unswingedPosition * 3
          }, found ${swingedPosition})`,
          measure
        );
      }
    }
  }

  return document;
}
