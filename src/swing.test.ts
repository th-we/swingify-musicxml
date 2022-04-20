import { JSDOM } from "jsdom";
import swing from "./swing";

function swingDocument(measures: string): [Document, () => string] {
  const dom = domFromMeasures(measures);

  return [
    swing(dom.window.document),
    () => new dom.window.XMLSerializer().serializeToString(dom.window.document),
  ];
}

function domFromMeasures(measures: string) {
  return new JSDOM(
    `
      <score-partwise>
        <part id="P1">
          ${measures}
        </part>
      </score-partwise>
    `,
    { contentType: "application/xml" }
  );
}

test("quarter triplets", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>12</divisions>
      </attributes>

      <note>
        <duration>12</duration>
      </note>

      <note>
        <duration>6</duration>
      </note>
      <note>
        <duration>6</duration>
      </note>

      <note>
        <duration>8</duration>
      </note>
      <note>
        <duration>8</duration>
      </note>
      <note>
        <duration>8</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("36 24 12 24 24 24");
});

test("eighth triplets", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>3</divisions>
      </attributes>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("3 3 3");
});

test("sixteenth on offbeat", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
      </attributes>

      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>

      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>2</duration>
      </note>

      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>

      <note>
        <duration>4</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("8 2 2 8 4 8 2 2 12");
});

test("sixteenth on downbeat", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
      </attributes>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>

     <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>

      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>2</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("3 3 3 3 3 6 3 8 4");
});

test("syncopation", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
      </attributes>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("4 6 2 4 2");
});

test("multiples of quarters", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
      </attributes>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>2</duration>
      </note>
      <note>
        <duration>3</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("3 6 9");
});

test("dotted quarters starting or ending on beat", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
      </attributes>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <duration>3</duration>
      </note>

      <note>
        <duration>3</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("4 8 10 2");
});

test("error when no division are defined", () => {
  const xml = `
    <measure number="1">
      <note>
        <duration>1</duration>
      </note>
    </measure>
  `;

  expect(() => swing(domFromMeasures(xml).window.document)).toThrow(
    "No divisions defined"
  );
});

test("chords", () => {
  const [document] = swingDocument(`
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
      </attributes>

      <note>
        <duration>1</duration>
      </note>
      <note>
        <chord/>
        <duration>1</duration>
      </note>
      <note>
        <duration>2</duration>
      </note>
      <note>
        <chord/>
        <duration>2</duration>
      </note>

      <note>
        <duration>1</duration>
      </note>
    </measure>
  `);

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("4 4 6 6 2");
});