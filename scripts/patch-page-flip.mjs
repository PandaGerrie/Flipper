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

/** Fresh npm installs track the cursor in the corner zone (makes the fold huge). */
const mouseFollowPattern =
  /else this\.do\(this\.render\.convertToPage\(t\)\);/g;

/**
 * Programmatic flipNext/flipPrev reuse flip(), which wrongly applies disableFlipByClick.
 * Use `f` (not `e`) — the method body already declares `const e = getBoundsRect()`.
 */
const flipGuardPattern =
  /flip\(t\)\{if\(this\.app\.getSettings\(\)\.disableFlipByClick&&!this\.isPointOnCorners\(t\)\)return;/;
const flipGuardPatched =
  "flip(t,f){if(!f&&this.app.getSettings().disableFlipByClick&&!this.isPointOnCorners(t))return;";
const flipNextPattern =
  /flipNext\(t\)\{this\.flip\(\{x:this\.render\.getRect\(\)\.left\+2\*this\.render\.getRect\(\)\.pageWidth-10,y:"top"===t\?1:this\.render\.getRect\(\)\.height-2\}\)\}/;
const flipNextPatched =
  'flipNext(t){this.flip({x:this.render.getRect().left+2*this.render.getRect().pageWidth-10,y:"top"===t?1:this.render.getRect().height-2},!0)}';
const flipPrevPattern =
  /flipPrev\(t\)\{this\.flip\(\{x:10,y:"top"===t\?1:this\.render\.getRect\(\)\.height-2\}\)\}/;
const flipPrevPatched =
  'flipPrev(t){this.flip({x:10,y:"top"===t?1:this.render.getRect().height-2},!0)}';

/** Undo our earlier single-page landscape experiment if present on an already-patched install. */
const createSpreadBroken =
  "createSpread(){this.landscapeSpread=[],this.portraitSpread=[];for(let t=0;t<this.pages.length;t++)this.portraitSpread.push([t]),this.landscapeSpread.push([t]);this.isShowCover&&this.pages.length&&(this.pages[0].setDensity(\"hard\"),this.pages[this.pages.length-1].setDensity(\"hard\"))}";
const createSpreadOriginal =
  "createSpread(){this.landscapeSpread=[],this.portraitSpread=[];for(let t=0;t<this.pages.length;t++)this.portraitSpread.push([t]);let t=0;this.isShowCover&&(this.pages[0].setDensity(\"hard\"),this.landscapeSpread.push([t]),t++);for(let e=t;e<this.pages.length;e+=2)e<this.pages.length-1?this.landscapeSpread.push([e,e+1]):(this.landscapeSpread.push([e]),this.pages[e].setDensity(\"hard\"))}";
const showSpreadBroken =
  "showSpread(){const t=this.getSpread()[this.currentSpreadIndex];2===t.length?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(this.pages[t[1]])):(this.render.setLeftPage(null),this.render.setRightPage(this.pages[t[0]])),this.currentPageIndex=t[0],this.app.updatePageIndex(this.currentPageIndex)}";
const showSpreadOriginal =
  'showSpread(){const t=this.getSpread()[this.currentSpreadIndex];2===t.length?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(this.pages[t[1]])):"landscape"===this.render.getOrientation()&&t[0]===this.pages.length-1?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(null)):(this.render.setLeftPage(null),this.render.setRightPage(this.pages[t[0]])),this.currentPageIndex=t[0],this.app.updatePageIndex(this.currentPageIndex)}';

function patchSource(source, label) {
  if (!source.match(cornerZonePattern) || !source.match(cornerFoldPattern)) {
    throw new Error(`Could not find page-flip corner patterns in ${label}`);
  }

  // Restore magazine spreads if a previous experiment is still applied.
  if (source.includes(createSpreadBroken)) {
    source = source.replace(createSpreadBroken, createSpreadOriginal);
  }
  if (source.includes(showSpreadBroken)) {
    source = source.replace(showSpreadBroken, showSpreadOriginal);
  }

  source = source.replace(
    cornerZonePattern,
    `Math.sqrt(Math.pow(i,2)+Math.pow(e.height,2))/${CORNER_HIT_DIVISOR}`,
  );
  source = source.replace(
    cornerFoldPattern,
    `this.calc.calc({x:i-1,y:1});const s=${CORNER_FOLD_PX}`,
  );

  // Remove mouse-follow on hover (idempotent if already patched).
  if (source.match(mouseFollowPattern)) {
    source = source.replace(mouseFollowPattern, "else;");
  }

  if (source.includes("else this.do(this.render.convertToPage(t))")) {
    throw new Error(`Corner mouse-follow still present in ${label}`);
  }

  // Fresh install becomes: }else;else this.setState("read")...
  if (!source.includes('else;else this.setState("read")')) {
    throw new Error(
      `Corner mouse-follow patch missing in ${label}. showCorner snippet: ${source.slice(Math.max(0, source.indexOf("showCorner")), source.indexOf("showCorner") + 420)}`,
    );
  }

  // Let toolbar / swipe flips ignore disableFlipByClick (idempotent).
  if (source.match(flipGuardPattern)) {
    source = source.replace(flipGuardPattern, flipGuardPatched);
  }
  if (source.match(flipNextPattern)) {
    source = source.replace(flipNextPattern, flipNextPatched);
  }
  if (source.match(flipPrevPattern)) {
    source = source.replace(flipPrevPattern, flipPrevPatched);
  }
  if (!source.includes(flipGuardPatched) || !source.includes(flipPrevPatched)) {
    throw new Error(`Programmatic flip bypass patch missing in ${label}`);
  }

  if (!source.includes(createSpreadOriginal) || !source.includes(showSpreadOriginal)) {
    throw new Error(`Magazine createSpread/showSpread missing in ${label}`);
  }

  return source;
}

mkdirSync(vendorDir, { recursive: true });

for (const file of files) {
  const path = join(distDir, file);
  const source = patchSource(readFileSync(path, "utf8"), file);
  writeFileSync(path, source);
  console.log(
    `Patched ${file} (hit /${CORNER_HIT_DIVISOR}, fold ${CORNER_FOLD_PX}px, magazine spreads, flipNext/Prev bypass)`,
  );
}

const vendorPath = join(vendorDir, "page-flip.browser.js");
copyFileSync(join(distDir, "page-flip.browser.js"), vendorPath);
console.log(`Copied patched bundle to ${vendorPath}`);
