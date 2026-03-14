import satori from 'satori';
import { getOswaldRegular, getOswaldBold } from './lib/render/fonts.ts';
import fs from 'fs';

const fontRegular = getOswaldRegular();
const fontBold = getOswaldBold();

const node = {
  type: "div",
  props: {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 900,
      height: 200,
      fontSize: 52,
      fontFamily: "Oswald",
      fontWeight: 700,
      color: "#ffffff",
      backgroundColor: "#000000",
    },
    children: "The Troubadour",
  },
};

const svg = await satori(node as any, {
  width: 900,
  height: 200,
  fonts: [
    { name: "Oswald", data: fontRegular, weight: 400, style: "normal" as const },
    { name: "Oswald", data: fontBold, weight: 700, style: "normal" as const },
  ],
});

fs.writeFileSync('/tmp/test_output.svg', svg);
console.log('Done. First 300 chars:');
console.log(svg.slice(0, 300));
