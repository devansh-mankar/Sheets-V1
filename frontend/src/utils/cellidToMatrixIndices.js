import { charToNumber } from "./charToNumbers.js";

export const cellidToMatrixIndices = (cellId) => {
  const columnLetters = cellId.match(/[A-Z]+/)[0]; // Extract column letters
  const columnNumber = charToNumber(columnLetters); // Convert to number

  const rowNumber = parseInt(cellId.match(/[0-9]+/)[0], 10) - 1; // Convert to zero-based index

  return { column: columnNumber, row: rowNumber };
};
