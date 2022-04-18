function throwError(message: string, element: Element): never {
  const measure = element.closest("measure");
  const measureInfo = !measure
    ? ""
    : ` in part ${measure.parentElement?.getAttribute(
        "id"
      )} measure ${measure.getAttribute("number")}`;
  throw new Error(message + measureInfo);
}

/**
 * Returns the divisions value that is currently active in the measure. Throws
 * an error if there is no active divisions value. Also modifies the <divisions>
 * element by tripling its value because in the output, we triple all the values
 * so the integer math still works with ternary rhythms. The returned value is
 * however the original value as read from the <divisions> element.
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
 * Makes sure that <duration> and <division> values are suitable for creating
 * ternary rhyhtms. Also makes sure that there are no unsupported elements
 * present.
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
    let makeBeatSwing = true;
    for (const measure of part.querySelectorAll("measure")) {
      checkMeasure(measure);
      divisions = updateDivisions(measure, divisions);

      let oldPosition = 0;
      let newPosition = 0;

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

        let newDuration = oldDuration * 3;
        if (makeBeatSwing) {
          newDuration = oldDuration * (onDownbeat ? 4 : 2);
        }
        durationElement.textContent = newDuration.toString();

        if (!note.querySelector("chord")) {
          oldPosition = oldPosition + oldDuration;
          newPosition = newPosition + newDuration;
        }
      }

      if (oldPosition * 3 !== newPosition) {
        throwError("Modified durations don't add up properly", measure);
      }
    }
  }

  return document;
}
