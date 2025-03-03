import { cellidToMatrixIndices } from "./cellIdToMatrixIndices.js";
import { CellValueState } from "../Store/CellValueState.js";

export const getEquationExpressionFromState = (
  getState,
  expression,
  notAllowedCellsIds = []
) => {
  // Check for circular references
  if (notAllowedCellsIds.some((cellId) => expression.includes(cellId))) {
    return "!ERROR";
  }

  // Extract all cell references (e.g., A1, B2, Z99)
  const cellValues = [...expression.matchAll(/[A-Z]+[0-9]+/gi)].map((match) => {
    const cellId = match[0];
    const { row, column } = cellidToMatrixIndices(cellId);
    let value = "";

    try {
      value = getState(CellValueState(`${row},${column}`)) || 0;

      // If value is another formula, recursively evaluate
      if (typeof value === "string" && value.startsWith("=")) {
        notAllowedCellsIds.push(cellId);
        value = getEquationExpressionFromState(
          getState,
          value.slice(1),
          notAllowedCellsIds
        );
      }
    } catch {
      value = 0;
    }

    return { cellId, value };
  });

  // Replace all cell IDs in expression with their evaluated values
  const evaluatedExpression = cellValues.reduce(
    (finalExpr, { cellId, value }) =>
      finalExpr.replaceAll(cellId, value.toString()),
    expression
  );

  // Wrap the final expression to maintain correct precedence
  return `(${evaluatedExpression})`;
};
