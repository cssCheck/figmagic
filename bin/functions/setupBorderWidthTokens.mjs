import { camelize } from './camelize.mjs';
import { formatName } from './formatName.mjs';

import {
  errorSetupBorderWidthTokensNoFrame,
  errorSetupBorderWidthTokensNoChildren,
  errorSetupBorderWidthTokensMissingProps
} from '../meta/errors.mjs';

/**
 * Places all Figma border widths into a clean object
 *
 * @exports
 * @function
 * @param {object} borderWidthFrame - The border widths frame from Figma
 * @returns {object} - Returns an object with all the border widths
 * @throws {error} - When there is no provided Figma frame
 */
export function setupBorderWidthTokens(borderWidthFrame) {
  if (!borderWidthFrame) throw new Error(errorSetupBorderWidthTokensNoFrame);
  if (!borderWidthFrame.children) throw new Error(errorSetupBorderWidthTokensNoChildren);

  let borderWidthObject = {};

  borderWidthFrame.children.forEach(type => {
    if (!type.name || !type.strokeWeight) throw new Error(errorSetupBorderWidthTokensMissingProps);

    let name = camelize(type.name);
    name = formatName(name);

    borderWidthObject[name] = `${type.strokeWeight}px`;
  });

  return borderWidthObject;
}
