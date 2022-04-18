import { JSDOM } from "jsdom";
import swing from "./swing";

function swingDocument(measures: string): [Document, () => string] {
  const dom = new JSDOM(
    `
      <score-partwise>
        <part id="P1">
          ${measures}
        </part>
      </score-partwise>
    `,
    { contentType: "application/xml" }
  );

  return [
    swing(dom.window.document),
    () => new dom.window.XMLSerializer().serializeToString(dom.window.document),
  ];
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
