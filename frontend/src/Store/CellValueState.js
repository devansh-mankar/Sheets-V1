import { atom } from "recoil";
import { memoize } from "../utils/Memoize.js";

export const CellValueState = (cellId) =>
  memoize(cellId, () =>
    atom({
      key: `cell_${cellId}`,
      default: "",
    })
  );
