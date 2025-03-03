import { selector } from "recoil";
import { memoize } from "../utils/memoize";
import { CellValueState } from "./CellValueState";
import { evaluate } from "mathjs";
import { getEquationExpressionFromState } from "../Utils/getEquationExpressionFromState";

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
