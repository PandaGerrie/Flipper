import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/** Default page-flip uses diagonal / 5 (~20% of page edge). */
const CORNER_HIT_DIVISOR = 22;

/** Default page-flip fold peek is 50px. */
const CORNER_FOLD_PX = 10;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "node_modules/page-flip/dist/js");
const vendorDir = join(root, "vendor");
const files = ["page-flip.browser.js", "page-flip.module.js"];

const cornerZonePattern =
  /Math\.sqrt\(Math\.pow\(i,2\)\+Math\.pow\(e\.height,2\)\)\/\d+/g;
const cornerFoldPattern = /this\.calc\.calc\(\{x:i-1,y:1\}\);const s=\d+/g;

const patchedMouseFollow =
  ",!1,!1)}else;else this.setState(\"read\"),this.render.finishAnimation(),this.stopMove()}animateFlippingTo";

const cornerMouseFollowPatterns = [
  {
    from: /,!1,!1\)\}else this\.setState\("read"\),this\.render\.finishAnimation\(\),this\.stopMove\(\)\}animateFlippingTo/g,
    to: patchedMouseFollow,
  },
  {
    from: /,!1,!1\)\}else;else this\.setState\("read"\),this\.render\.finishAnimation\(\),this\.stopMove\(\)\}animateFlippingTo/g,
    to: patchedMouseFollow,
  },
];

const legacyMouseFollowPattern = /else this\.do\(this\.render\.convertToPage\(t\)\);/g;

function patchSource(source, label) {
  if (!source.match(cornerZonePattern) && !source.match(cornerFoldPattern)) {
    throw new Error(`Could not find page-flip corner patterns in ${label}`);
  }

  source = source.replace(
    cornerZonePattern,
    `Math.sqrt(Math.pow(i,2)+Math.pow(e.height,2))/${CORNER_HIT_DIVISOR}`,
  );
  source = source.replace(
    cornerFoldPattern,
    `this.calc.calc({x:i-1,y:1});const s=${CORNER_FOLD_PX}`,
  );

  for (const { from, to } of cornerMouseFollowPatterns) {
    if (source.match(from)) {
      source = source.replace(from, to);
    }
  }

  if (!source.includes("else;else this.setState(\"read\")")) {
    throw new Error(`Corner mouse-follow patch missing in ${label}`);
  }

  if (source.match(legacyMouseFollowPattern)) {
    source = source.replace(legacyMouseFollowPattern, "else;");
  }

  if (source.includes("else this.do(this.render.convertToPage(t))")) {
    throw new Error(`Corner mouse-follow still present in ${label}`);
  }

  return source;
}

mkdirSync(vendorDir, { recursive: true });

for (const file of files) {
  const path = join(distDir, file);
  const source = patchSource(readFileSync(path, "utf8"), file);
  writeFileSync(path, source);
  console.log(
    `Patched ${file} (hit /${CORNER_HIT_DIVISOR}, fold ${CORNER_FOLD_PX}px, no mouse-follow hint)`,
  );
}

const vendorPath = join(vendorDir, "page-flip.browser.js");
copyFileSync(join(distDir, "page-flip.browser.js"), vendorPath);
console.log(`Copied patched bundle to ${vendorPath}`);
