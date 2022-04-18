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
 * @param oldDivisions  Divisions value that was used in the preceding measure.
 * Unless this measure has a <division> element of its own, the old divisions
 * value remains active and will be returned.
 */
function updateDivisions(measure: Element, oldDivisions?: number) {
  const divisionsElement = measure.querySelector("attributes > divisions");

  if (divisionsElement) {
    const value = parseIntOrThrow(divisionsElement);
    divisionsElement.textContent = (value * 3).toString();
    return value;
  }

  if (!oldDivisions) {
    throwError("No divisions defined", measure);
  }

  return oldDivisions;
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

export default function swing(document: Document) {
  for (const part of document.querySelectorAll("score-partwise > part")) {
    let divisions = undefined;
    for (const measure of part.querySelectorAll("measure")) {
      checkMeasure(measure);
      divisions = updateDivisions(measure, divisions);

      let oldPosition = 0;
      let newPosition = 0;
      let makeBeatSwing = true;

      for (const note of measure.querySelectorAll("note")) {
        const durationElement = note.querySelector("duration");
        if (!durationElement) {
          throwError("<duration> element missing on note", note);
        }
        const oldDuration = parseIntOrThrow(durationElement);

        const onDownbeat = oldPosition % divisions === 0;
        if (onDownbeat) {
          // We only want to make this beat swing if it starts with an eighth
          // note
          // TODO: This will skip e.g. dotted quarter notes! Handle them!
          // TODO: Won't work in groups like 𝅘𝅥𝅮𝅘𝅥𝅮 𝅘𝅥  𝅘𝅥𝅮
          makeBeatSwing = oldDuration === divisions / 2;
        }

        let newDuration;

        if (!makeBeatSwing || oldDuration % divisions === 0) {
          // We basically keep the original duration if we have a non-swinging
          // or if the note is a multiple of a quarter note (including
          // syncopation).
          newDuration = oldDuration * 3;
        } else if (onDownbeat) {
          // Lengthen on downbeat
          newDuration = oldDuration * 4;
        } else {
          // Shorten all other durations
          newDuration = oldDuration * 2;
        }

        durationElement.textContent = newDuration.toString();

        if (!note.querySelector("chord")) {
          oldPosition = oldPosition + oldDuration;
          newPosition = newPosition + newDuration;
        }
      }

      if (oldPosition * 3 !== newPosition) {
        throwError(
          `Faulty processing: Modified durations don't add up properly (expected duration sum ${
            oldPosition * 3
          }, found ${newPosition})`,
          measure
        );
      }
    }
  }

  return document;
}
