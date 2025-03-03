import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { CellValueState } from "../Store/CellValueState.js";
import { EvaluatedCellValueState } from "../Store/EvaluateCellValueState.js";
import { SelectedCellsState } from "../Store/SelectedCellsState.js";

export const CELL_WIDTH = 100;
export const CELL_HEIGHT = 25;

const Cell = ({ cellId }) => {
  const [cellValue, setCellValue] = useRecoilState(CellValueState(cellId));
  const evaluatedCellValueState = useRecoilValue(
    EvaluatedCellValueState(cellId)
  );
  const [selectedCells, setSelectedCells] = useRecoilState(SelectedCellsState);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const inputRef = useRef(null);

  // Check if this cell is currently selected
  useEffect(() => {
    setIsSelected(selectedCells.includes(cellId));
  }, [selectedCells, cellId]);

  const handleCellClick = (e) => {
    // If we're clicking on a selected cell without modifiers, enable edit mode
    if (isSelected && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setIsEditMode(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // Shift+click for range selection
    if (e.shiftKey && selectedCells.length > 0) {
      const anchorCell = selectedCells[0]; // Use the first cell as the anchor point

      // Parse cellIds to get row and column numbers
      // Adjust for the format "rowIndex,columnIndex"
      const [anchorRow, anchorCol] = anchorCell.split(",").map(Number);
      const [currentRow, currentCol] = cellId.split(",").map(Number);

      // Calculate the range boundaries
      const startRow = Math.min(anchorRow, currentRow);
      const endRow = Math.max(anchorRow, currentRow);
      const startCol = Math.min(anchorCol, currentCol);
      const endCol = Math.max(anchorCol, currentCol);

      // Generate all cells in the range
      const newSelection = [];
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          newSelection.push(`${row},${col}`);
        }
      }

      // Set the selection to be exactly the range
      setSelectedCells(newSelection);
    }
    // Ctrl/Cmd+click for individual cell toggling
    else if (e.ctrlKey || e.metaKey) {
      if (selectedCells.includes(cellId)) {
        // Remove from selection if already selected
        setSelectedCells(selectedCells.filter((id) => id !== cellId));
      } else {
        // Add to selection
        setSelectedCells([...selectedCells, cellId]);
      }
    }
    // Normal click for single cell selection
    else {
      setSelectedCells([cellId]);
    }
  };

  const changeInputToLabel = () => {
    setIsEditMode(false);
  };

  // Use useCallback to memoize the function so it doesn't change on every render
  const onClickOutsideInputHandler = useCallback(
    (event) => {
      if (event.target?.dataset?.cellId !== cellId) {
        // Don't clear selection when clicking outside, only exit edit mode
        if (isEditMode) {
          changeInputToLabel();
        }
      }
    },
    [cellId, isEditMode]
  ); // Add the dependencies that this function uses

  const onDefocusInputHandler = (event) => {
    if (event.key === "Enter") {
      changeInputToLabel();
    }
  };

  // Now include onClickOutsideInputHandler in the dependencies
  useEffect(() => {
    document.addEventListener("click", onClickOutsideInputHandler);
    return () =>
      document.removeEventListener("click", onClickOutsideInputHandler);
  }, [onClickOutsideInputHandler]); // This will re-subscribe when the handler changes

  return isEditMode ? (
    <input
      ref={inputRef}
      data-cell-id={cellId}
      value={cellValue}
      onChange={(e) => setCellValue(e.target.value)}
      onKeyDown={onDefocusInputHandler}
      className="w-full h-full text-base p-1 outline-none border-2 border-blue-700 bg-white"
    />
  ) : (
    <div
      data-cell-id={cellId}
      onClick={handleCellClick}
      className={`w-full h-full leading-5 p-1 text-ellipsis whitespace-nowrap border ${
        isSelected
          ? "border-2 border-blue-700 bg-blue-50"
          : "border-gray-300 bg-white"
      }`}
    >
      {evaluatedCellValueState}
    </div>
  );
};

export default Cell;
