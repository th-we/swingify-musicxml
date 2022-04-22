import { JSDOM } from "jsdom";
import swingify, { Options } from "./swingify";

function swingDocument(
  measures: string,
  options?: Options
): [Document, () => string] {
  const dom = domFromMeasures(measures);

  return [
    swingify(dom.window.document, options),
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

  expect(() => swingify(domFromMeasures(xml).window.document)).toThrow(
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

test("inconsistent chord", () => {
  expect(() =>
    swingDocument(`
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <note>
          <duration>1</duration>
        </note>
        <note>
          <chord/>
          <duration>2</duration>
        </note>
      </measure>
    `)
  ).toThrow(/Chord notes must all be the same duration/);
});

test("chord without initial note", () => {
  expect(() =>
    swingDocument(`
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <note>
          <chord/>
          <duration>2</duration>
        </note>
      </measure>
    `)
  ).toThrow(/Found chord note without preceding main chord note/);
});

test("noswingColor", () => {
  const [document] = swingDocument(
    `
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
      </attributes>

      <!-- not swingified because first note in beat is marked -->
      <note color="#FFFF00">
        <duration>1</duration>
      </note>
      <note>
        <duration>1</duration>
      </note>

      <!-- swingified because color is not matching 'noswingColor' -->
      <note color="#00FF00">
        <duration>1</duration>
      </note>
      <!-- No influence on swingification as it does not start the beat: -->
      <note color="#FFFF00">
        <duration>1</duration>
      </note>
    </measure>
  `,
    { noswingColor: "#ffff00" }
  );

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("3 3 4 2");
});

test("default noswingColor", () => {
  const [document] = swingDocument(
    `
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <!-- not swingified because first note in beat is marked -->
        <note color="#FF0000">
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
      </measure>
    `
  );

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("3 3 4 2");
});

test("color attributes that don't match `nowswingColor` have no effect on swing", () => {
  const [document] = swingDocument(
    `
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <note color="#000000">
          <duration>1</duration>
        </note>
        <note>
          <duration>1</duration>
        </note>
      </measure>
    `
  );

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("4 2");
});

test("noswingColor='NONE'", () => {
  const [document] = swingDocument(
    `
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <note color="#FF0000">
          <duration>1</duration>
        </note>
        <note>
          <duration>1</duration>
        </note>
      </measure>
    `,
    { noswingColor: 'NONE' }
  );

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("4 2");
});

test("default silenceColor", () => {
  const [document] = swingDocument(
    `
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <note color="#0000FF">
          <duration>1</duration>
        </note>
        <note>
          <duration>1</duration>
        </note>
      </measure>
    `
  );

  expect(
    [...document.querySelectorAll("note")]
      .map((note) => (note.querySelector("rest") ? "rest" : "note"))
      .join(" ")
  ).toBe("rest note");

  expect(
    [...document.querySelectorAll("duration")]
      .map((e) => e.textContent)
      .join(" ")
  ).toBe("4 2");
});

test("custom silenceColor", () => {
  const [document] = swingDocument(
    `
      <measure number="1">
        <attributes>
          <divisions>2</divisions>
        </attributes>

        <note>
          <duration>1</duration>
        </note>
        <note color="#FF00FF">
          <duration>1</duration>
        </note>
      </measure>
    `,
    { silenceColor: "#FF00FF" }
  );

  expect(
    [...document.querySelectorAll("note")]
      .map((note) => (note.querySelector("rest") ? "rest" : "note"))
      .join(" ")
  ).toBe("note rest");
});

test("silence chords", () => {
  const [document] = swingDocument(
    `
      <measure number="1">
        <attributes>
          <divisions>1</divisions>
        </attributes>

        <note color="#0000FF">
          <duration>1</duration>
        </note>
        <note color="#0000FF">
          <chord/>
          <duration>1</duration>
        </note>
      </measure>
    `
  );

  expect(
    [...document.querySelectorAll("note")]
      .map((note) => (note.querySelector("rest") ? "rest" : "note"))
      .join(" ")
  ).toBe("rest");
});
