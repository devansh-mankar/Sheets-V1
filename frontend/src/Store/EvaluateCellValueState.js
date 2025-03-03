import { selector } from "recoil";
import { memoize } from "../utils/Memoize.js";
import { CellValueState } from "./CellValueState.js";
import { evaluate } from "mathjs";
import { getEquationExpressionFromState } from "../utils/getEquationExpressionFromState.js";

export const EvaluatedCellValueState = (cellId) =>
  memoize(`evaluatedCell_${cellId}`, () =>
    selector({
      key: `evaluatedCell_${cellId}`,
      get: ({ get }) => {
        const value = get(CellValueState(cellId));

        if (typeof value === "string" && value.startsWith("=")) {
          try {
            const evaluatedExpression = getEquationExpressionFromState(
              get,
              value.slice(1)
            );

            if (evaluatedExpression === "!ERROR") {
              return "!ERROR";
            }

            return evaluate(evaluatedExpression);
          } catch {
            return value;
          }
        }

        return value;
      },
    })
  );
