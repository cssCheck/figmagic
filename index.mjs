#!/bin/sh
':'; //# ; exec /usr/bin/env node --experimental-modules --no-warnings "$0" "$@"

import trash from 'trash';
import dotenv from 'dotenv';

import { colors } from './bin/meta/colors.mjs';
import { loadFile } from './bin/functions/loadFile.mjs';
import { createConfiguration } from './bin/functions/createConfiguration.mjs';
import { createFolder } from './bin/functions/createFolder.mjs';
import { getFromApi } from './bin/functions/getFromApi.mjs';
import { createPage } from './bin/functions/createPage.mjs';
import { getGraphics } from './bin/functions/getGraphics.mjs';
import { writeTokens } from './bin/functions/writeTokens.mjs';
import { writeFile } from './bin/functions/writeFile.mjs';

import { errorGetData } from './bin/meta/errors.mjs';
import {
  msgSetDataFromLocal,
  msgSetDataFromApi,
  msgWriteBaseFile,
  msgGetImagesFromApi,
  msgWriteTokens,
  msgJobComplete
} from './bin/meta/messages.mjs';

async function figmagic() {
  // Setup
  dotenv.config();
  const [, , ...CLI_ARGS] = process.argv;
  const USER_CONFIG_PATH = `${process.cwd()}/.figmagicrc`;
  const CONFIG = await createConfiguration(USER_CONFIG_PATH, ...CLI_ARGS);
  const {
    token,
    url,
    recompileLocal,
    syncGraphics,
    outputFolderBaseFile,
    outputFolderTokens,
    outputFolderGraphics,
    outputFileName
  } = CONFIG;

  const DATA = await (async () => {
    // Normal: We want to get data from the Figma API
    if (!recompileLocal) {
      console.log(msgSetDataFromApi);

      // Attempt to get data
      try {
        const _DATA = await getFromApi(token, url);

        // If there's no data or something went funky, eject
        if (!_DATA || _DATA.status === 403) throw new Error(`${colors.FgRed}${errorGetData}`);

        return _DATA;
      } catch (error) {
        throw new Error(`${colors.FgRed}${error}`);
      }
    }
    // Recompile: We want to use the existing Figma JSON file
    else {
      console.log(msgSetDataFromLocal);

      try {
        return await loadFile(`./${outputFolderBaseFile}/${outputFileName}`);
      } catch (error) {
        throw new Error(`${colors.FgRed}${error}`);
      }
    }
  })().catch(error => {
    throw new Error(`${colors.FgRed}${error}`);
  });

  // If this is a fresh pull from the API, trash the old folders
  if (!recompileLocal) {
    await trash([`./${outputFolderTokens}`]);
    await trash([`./${outputFolderBaseFile}`]);

    if (syncGraphics) {
      await trash([`./${outputFolderGraphics}`]);
    }
  }

  // Create new folders if they don't exist
  await createFolder(outputFolderTokens);
  await createFolder(outputFolderBaseFile);

  if (syncGraphics) {
    await createFolder(outputFolderGraphics);
  }

  if (!recompileLocal) {
    // Write base Figma JSON if we are pulling from the web
    console.log(msgWriteBaseFile);
    await writeFile(JSON.stringify(DATA), outputFolderBaseFile, outputFileName);
  }

  // Syncing graphics
  if (syncGraphics) {
    console.log(msgGetImagesFromApi);
    const GRAPHICS_PAGE = createPage(DATA.document.children, 'Graphics');
    await getGraphics(GRAPHICS_PAGE.children, CONFIG);
  }

  // Process tokens
  console.log(msgWriteTokens);
  const TOKENS_PAGE = createPage(DATA.document.children, 'Design Tokens');
  await writeTokens(TOKENS_PAGE.children, CONFIG);

  // All went well
  console.log(msgJobComplete);
}

(async () => {
  try {
    await figmagic();
  } catch (error) {
    console.error(`${colors.FgRed}${error}`);
  }
})();
