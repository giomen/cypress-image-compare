const fs = require('fs');

const fsp = require('fs/promises');

const path = require('path');

const {
  PNG
} = require('pngjs');

const pixelmatch = require('pixelmatch');

const sanitize = require('sanitize-filename');

const {
  adjustCanvas,
  createFolder,
  parseImage,
  errorSerialize
} = require('./utils');

const {
  getValueOrDefault
} = require('./utils-browser');

let CYPRESS_SCREENSHOT_DIR;

function setupScreenshotPath() {
  // use cypress default path as fallback
  CYPRESS_SCREENSHOT_DIR = 'cypress/smokes/actual'
}
/** Move the generated snapshot .png file to its new path.
 * The target path is constructed from parts at runtime in node to be OS independent.  */


async function moveSnapshot(args) {
  const {
    fromPath,
    specDirectory,
    fileName
  } = args;
  const destDir = path.join(CYPRESS_SCREENSHOT_DIR, specDirectory);
  const destFile = path.join(destDir, fileName);
  return createFolder(destDir, false).then(() => fsp.rename(fromPath, destFile)).then(() => null);
}

/** Move the generated snapshot .png file from its path to base.
 * The target path is constructed from parts at runtime in node to be OS independent.  */
async function moveSnapshotToBase(args) {
  const {
    name,
    specDirectory,
    snapshotBaseDirectory
  } = args;

  const destDir = path.join(snapshotBaseDirectory, specDirectory);
  const destFile = path.join(destDir, name);

  fs.mkdirSync(destDir, { recursive: true });

  const fromPath = path.join(CYPRESS_SCREENSHOT_DIR, specDirectory);
  const fromPathFile = path.join(fromPath, name);

  try {
    // create the destination directory if it doesn't exist
    fs.mkdirSync(destDir, { recursive: true });
    await fsp.copyFile(`${fromPathFile}.png`, `${destFile}.png`);
    return true;
  } catch (err) {
    return false;
  }
  // return createFolder(destDir, false).then(() => fsp.rename(CYPRESS_SCREENSHOT_DIR, destFile)).then(() => null);
}
/** Update the base snapshot .png by copying the generated snapshot to the base snapshot directory.
 * The target path is constructed from parts at runtime in node to be OS independent.  */


async function updateSnapshot(args) {
  const {
    name,
    screenshotsFolder,
    snapshotBaseDirectory,
    specDirectory
  } = args;
  const toDir = getValueOrDefault(snapshotBaseDirectory, path.join(process.cwd(), 'cypress', 'smokes', 'base'));
  const snapshotActualDirectory = getValueOrDefault(screenshotsFolder, 'cypress/smokes/actual');
  const destDir = path.join(toDir, specDirectory);
  const fromPath = path.join(snapshotActualDirectory, specDirectory, `${name}.png`);
  const destFile = path.join(destDir, `${name}.png`);
  return createFolder(destDir, false).then(() => fsp.copyFile(fromPath, destFile)).then(() => null);
}
/** Cypress plugin to compare image snapshots & generate a diff image.
 *
 * Uses the pixelmatch library internally.
 */

async function isSnapshotPresent(args) {
  const {
    name,
    specDirectory,
    snapshotBaseDirectory
  } = args;

  const fileName = sanitize(name);
  const image = path.join(snapshotBaseDirectory, specDirectory, `${fileName}.png`)
  const existImage = await fs.existsSync(image)

  try {
    if (!existImage) {
      await moveSnapshotToBase({ name, specDirectory, snapshotBaseDirectory })
      return false
    }
  } catch {
    throw new Error('Error in existing image check')
  }
  return true
}

async function compareSnapshotsPlugin(args) {
  const snapshotBaseDirectory = getValueOrDefault(args.baseDir, path.join(process.cwd(), 'cypress', 'smokes', 'base'));
  const snapshotDiffDirectory = getValueOrDefault(args.diffDir, path.join(process.cwd(), 'cypress', 'smokes', 'diff'));
  const alwaysGenerateDiff = !(args.keepDiff === false);
  const allowVisualRegressionToFail = args.allowVisualRegressionToFail === true;
  const fileName = sanitize(args.fileName);
  const options = {
    actualImage: path.join(CYPRESS_SCREENSHOT_DIR, args.specDirectory, `${fileName}.png`),
    expectedImage: path.join(snapshotBaseDirectory, args.specDirectory, `${fileName}.png`),
    diffImage: path.join(snapshotDiffDirectory, args.specDirectory, `${fileName}.png`)
  };
  let mismatchedPixels = 0;
  let percentage = 0;

  try {
    await createFolder(snapshotDiffDirectory, args.failSilently);
    const imgExpected = await parseImage(options.expectedImage);
    const imgActual = await parseImage(options.actualImage);
    const diff = new PNG({
      width: Math.max(imgActual.width, imgExpected.width),
      height: Math.max(imgActual.height, imgExpected.height)
    });
    const imgActualFullCanvas = adjustCanvas(imgActual, diff.width, diff.height);
    const imgExpectedFullCanvas = adjustCanvas(imgExpected, diff.width, diff.height);
    mismatchedPixels = pixelmatch(imgActualFullCanvas.data, imgExpectedFullCanvas.data, diff.data, diff.width, diff.height, {
      threshold: 0.1
    });
    percentage = (mismatchedPixels / diff.width / diff.height) ** 0.5;

    if (percentage > args.errorThreshold) {
      const specFolder = path.join(snapshotDiffDirectory, args.specDirectory);
      await createFolder(specFolder, args.failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
      if (!allowVisualRegressionToFail) throw new Error(`The "${fileName}" image is different. Threshold limit exceeded! \nExpected: ${args.errorThreshold} \nActual: ${percentage}`);
    } else if (alwaysGenerateDiff) {
      const specFolder = path.join(snapshotDiffDirectory, args.specDirectory);
      await createFolder(specFolder, args.failSilently);
      diff.pack().pipe(fs.createWriteStream(options.diffImage));
    }
  } catch (error) {
    return {
      error: errorSerialize(error)
    };
  }

  return {
    mismatchedPixels,
    percentage
  };
}
/** Install plugin to compare snapshots.
 * (Also installs an internally used plugin to move snapshot files). */


function getCompareSnapshotsPlugin(on, config) {
  setupScreenshotPath(config);
  on('task', {
    compareSnapshotsPlugin,
    moveSnapshot,
    updateSnapshot,
    moveSnapshotToBase,
    isSnapshotPresent
  });
}

module.exports = getCompareSnapshotsPlugin;
