import React, { useEffect, useState, useRef, useCallback } from "react";
import Cell from "../Cells/Cell";
import { useRecoilState } from "recoil";
import { SelectedCellsState } from "../Store/SelectedCellsState.js";
import { CellValueState } from "../Store/CellValueState.js";
import { useRecoilCallback } from "recoil";

import { numberToChar } from "../utils/numberToChar.js";

export const DEFAULT_CELL_WIDTH = 100;
export const DEFAULT_CELL_HEIGHT = 25;

const Sheet = () => {
  const [columnWidths, setColumnWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [numberOfColumns, setNumberOfColumns] = useState(0);
  const [numberOfRows, setNumberOfRows] = useState(0);
  const [sheetWidth, setSheetWidth] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);

  // Use the existing Recoil state for selected cells
  const [selectedCells, setSelectedCells] = useRecoilState(SelectedCellsState);

  // Selection states
  const [selectionStart, setSelectionStart] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  // Refs to track what operation we're doing
  const operationRef = useRef("none"); // "none", "select", "resize"
  const dragStartRef = useRef(null);
  const ignoreNextClickRef = useRef(false);

  // Initialize Sheet Size based on viewport
  const updateSheetSize = () => {
    const width = window.innerWidth - 50; // Adjust for margins
    const height = window.innerHeight - 120; // Adjust for header and padding
    setSheetWidth(width);
    setSheetHeight(height);
    setNumberOfColumns(Math.floor(width / DEFAULT_CELL_WIDTH));
    setNumberOfRows(Math.floor(height / DEFAULT_CELL_HEIGHT));
  };

  useEffect(() => {
    updateSheetSize();
    window.addEventListener("resize", updateSheetSize);
    return () => window.removeEventListener("resize", updateSheetSize);
  }, []);

  // Recoil callback to update cell values
  const updateCellValue = useRecoilCallback(
    ({ set }) =>
      (cellId, value) => {
        const cellState = CellValueState(cellId);
        set(cellState, value);
      },
    []
  );

  // Helper function to parse CSV rows while respecting quotes
  const parseCSVRow = useCallback((rowText) => {
    const result = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];

      if (char === '"') {
        // Toggle quote state
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        // End of cell
        result.push(cell);
        cell = "";
      } else {
        // Add character to current cell
        cell += char;
      }
    }

    // Add the last cell
    result.push(cell);

    // Clean up the cells: remove surrounding quotes and convert escaped quotes
    return result.map((cell) => {
      // Remove surrounding quotes
      if (cell.startsWith('"') && cell.endsWith('"')) {
        cell = cell.substring(1, cell.length - 1);
      }

      // Convert escaped quotes
      cell = cell.replace(/""/g, '"');

      return cell;
    });
  }, []);

  // Process multi-cell paste - wrapped in useCallback
  const processMultiCellPaste = useCallback(
    (pastedData) => {
      // Split the pasted data into rows
      const rows = pastedData
        .split(/\r\n|\n|\r/)
        .filter((row) => row.trim() !== "");

      // Split each row into cells (handle both tab-separated and comma-separated values)
      const pastedGrid = rows.map((row) => {
        // Check for tabs first, if none found try commas
        if (row.includes("\t")) {
          return row.split("\t");
        } else {
          // For CSV, handle quoted values properly
          return parseCSVRow(row);
        }
      });

      // Calculate dimensions of pasted data
      const pasteHeight = pastedGrid.length;
      const pasteWidth = Math.max(...pastedGrid.map((row) => row.length));

      // If only one cell is selected, use it as the starting point
      // Otherwise use the top-left cell of the selection
      let startCellId = selectedCells[0];
      if (selectedCells.length > 1) {
        // Find the top-left cell in the selection
        let minRow = Infinity;
        let minCol = Infinity;

        for (const cellId of selectedCells) {
          const [row, col] = cellId.split(",").map(Number);
          minRow = Math.min(minRow, row);
          minCol = Math.min(minCol, col);
        }

        startCellId = `${minRow},${minCol}`;
      }

      // Parse the starting cell coordinates
      const [startRow, startCol] = startCellId.split(",").map(Number);

      // Fill the cells with pasted data
      for (let i = 0; i < pasteHeight; i++) {
        for (let j = 0; j < pastedGrid[i].length; j++) {
          const rowIndex = startRow + i;
          const colIndex = startCol + j;

          // Skip if outside grid bounds
          if (rowIndex >= numberOfRows || colIndex >= numberOfColumns) continue;

          const cellId = `${rowIndex},${colIndex}`;
          updateCellValue(cellId, pastedGrid[i][j]);
        }
      }

      // Update selected cells to cover the paste area
      if (pasteHeight > 1 || pasteWidth > 1) {
        const newSelectedCells = [];
        for (let i = 0; i < pasteHeight; i++) {
          for (let j = 0; j < pasteWidth; j++) {
            const rowIndex = startRow + i;
            const colIndex = startCol + j;

            // Skip if outside grid bounds
            if (rowIndex >= numberOfRows || colIndex >= numberOfColumns)
              continue;

            newSelectedCells.push(`${rowIndex},${colIndex}`);
          }
        }

        // Only update selection if we have cells
        if (newSelectedCells.length > 0) {
          setSelectedCells(newSelectedCells);
        }
      }
    },
    [
      selectedCells,
      numberOfRows,
      numberOfColumns,
      updateCellValue,
      parseCSVRow,
      setSelectedCells,
    ]
  );

  // Handle pasting of data
  useEffect(() => {
    const handlePaste = (event) => {
      // Only handle paste if we have cells selected
      if (selectedCells.length === 0) return;

      // Get clipboard text
      const clipboardData = event.clipboardData || window.clipboardData;
      const pastedData = clipboardData.getData("text");

      if (!pastedData) return;

      // Process the pasted data
      processMultiCellPaste(pastedData);

      // Prevent the default paste behavior
      event.preventDefault();
    };

    // Add paste event listener
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectedCells, processMultiCellPaste]);

  // Handle Column Resize
  const handleColumnResize = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    operationRef.current = "resize";
    let startX = event.clientX;
    const initialWidth = columnWidths[index] || DEFAULT_CELL_WIDTH;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(
        50,
        initialWidth + (moveEvent.clientX - startX)
      ); // Min width: 50px
      setColumnWidths((prev) => ({ ...prev, [index]: newWidth }));
    };

    const onMouseUp = () => {
      operationRef.current = "none";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Handle Row Resize
  const handleRowResize = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    operationRef.current = "resize";
    let startY = event.clientY;
    const initialHeight = rowHeights[index] || DEFAULT_CELL_HEIGHT;

    const onMouseMove = (moveEvent) => {
      const newHeight = Math.max(
        20,
        initialHeight + (moveEvent.clientY - startY)
      ); // Min height: 20px
      setRowHeights((prev) => ({ ...prev, [index]: newHeight }));
    };

    const onMouseUp = () => {
      operationRef.current = "none";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Handle Bottom-Right Corner Resize (Expands Sheet)
  const handleSheetResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    operationRef.current = "resize";
    let startX = event.clientX;
    let startY = event.clientY;
    let initialWidth = sheetWidth;
    let initialHeight = sheetHeight;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(
        200,
        initialWidth + (moveEvent.clientX - startX)
      );
      const newHeight = Math.max(
        100,
        initialHeight + (moveEvent.clientY - startY)
      );
      setSheetWidth(newWidth);
      setSheetHeight(newHeight);
      setNumberOfColumns(Math.floor(newWidth / DEFAULT_CELL_WIDTH));
      setNumberOfRows(Math.floor(newHeight / DEFAULT_CELL_HEIGHT));
    };

    const onMouseUp = () => {
      operationRef.current = "none";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // This function will be used to detect cells underneath the pointer during drag operations
  const getCellFromPoint = useCallback((x, y) => {
    const elements = document.elementsFromPoint(x, y);
    for (let element of elements) {
      // Find the closest td element (cell container)
      if (element.tagName === "TD") {
        // Find the data-cell-id from the first child (which should be our Cell component)
        const cellElement = element.querySelector("[data-cell-id]");
        if (cellElement && cellElement.dataset.cellId) {
          return cellElement.dataset.cellId;
        }
      }
    }
    return null;
  }, []);

  // Start cell selection via mouse
  const handleTableMouseDown = (event) => {
    // Only handle left mouse button
    if (event.buttons !== 1) return;

    // Ignore if we're clicking on a resize handle or already in another operation
    if (operationRef.current !== "none") return;
    if (
      event.target.classList.contains("cursor-col-resize") ||
      event.target.classList.contains("cursor-row-resize") ||
      event.target.classList.contains("cursor-nwse-resize")
    ) {
      return;
    }

    // Ignore clicks on cell content (let Cell component handle those)
    if (event.target.dataset && event.target.dataset.cellId) {
      return;
    }

    // If we're clicking on a header, let those handlers manage it
    if (event.target.tagName === "TH") {
      return;
    }

    operationRef.current = "select";
    setIsDragging(true);

    // Get starting cell coordinates from mouse position
    const cellId = getCellFromPoint(event.clientX, event.clientY);
    if (!cellId) return;

    const [startRow, startCol] = cellId.split(",").map(Number);
    dragStartRef.current = { row: startRow, col: startCol };
    setSelectionStart({ row: startRow, col: startCol });

    // Initial selection
    if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
      setSelectedCells([cellId]);
    }

    // Set up global mouse move and up handlers
    const onMouseMove = (moveEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const currentCellId = getCellFromPoint(
        moveEvent.clientX,
        moveEvent.clientY
      );
      if (!currentCellId) return;

      const [currentRow, currentCol] = currentCellId.split(",").map(Number);

      // Calculate range
      const startRow = dragStartRef.current.row;
      const startCol = dragStartRef.current.col;
      const minRow = Math.min(startRow, currentRow);
      const maxRow = Math.max(startRow, currentRow);
      const minCol = Math.min(startCol, currentCol);
      const maxCol = Math.max(startCol, currentCol);

      // Generate selection range
      const newSelection = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          newSelection.push(`${row},${col}`);
        }
      }

      setSelectedCells(newSelection);
      ignoreNextClickRef.current = true;
    };

    const onMouseUp = () => {
      setIsDragging(false);
      operationRef.current = "none";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // Set a short timeout to prevent immediately triggering a cell click
      setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 10);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Special handler for cell container clicks
  const handleCellContainerClick = (rowIndex, columnIndex, event) => {
    // If we just finished a drag, ignore this click
    if (ignoreNextClickRef.current) {
      event.stopPropagation();
      return;
    }

    // Ignore if clicked on the actual cell content (let the Cell component handle it)
    if (event.target.dataset && event.target.dataset.cellId) {
      return;
    }

    const cellId = `${rowIndex},${columnIndex}`;

    // Handle click with modifiers
    if (event.shiftKey && selectedCells.length > 0) {
      // Get last selected cell
      const lastCell = selectedCells[selectedCells.length - 1];
      const [lastRow, lastCol] = lastCell.split(",").map(Number);

      // Calculate range
      const minRow = Math.min(lastRow, rowIndex);
      const maxRow = Math.max(lastRow, rowIndex);
      const minCol = Math.min(lastCol, columnIndex);
      const maxCol = Math.max(lastCol, columnIndex);

      // Generate range selection
      const newSelection = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          newSelection.push(`${row},${col}`);
        }
      }

      setSelectedCells(newSelection);
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle selection for this cell
      if (selectedCells.includes(cellId)) {
        setSelectedCells(selectedCells.filter((id) => id !== cellId));
      } else {
        setSelectedCells([...selectedCells, cellId]);
      }
    } else {
      // Regular click: select just this cell
      setSelectedCells([cellId]);
    }
  };

  // Handle keyboard navigation and selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCells.length === 0) return;

      // Get the current active cell (last cell in selection)
      const lastCell = selectedCells[selectedCells.length - 1];
      const [lastRow, lastCol] = lastCell.split(",").map(Number);

      // Handle arrow keys for navigation
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        let newRow = lastRow;
        let newCol = lastCol;

        // Calculate new position
        if (e.key === "ArrowUp" && newRow > 0) newRow--;
        if (e.key === "ArrowDown" && newRow < numberOfRows - 1) newRow++;
        if (e.key === "ArrowLeft" && newCol > 0) newCol--;
        if (e.key === "ArrowRight" && newCol < numberOfColumns - 1) newCol++;

        const newCellId = `${newRow},${newCol}`;

        // Shift key extends selection
        if (e.shiftKey) {
          // If this is the first shift+arrow, use the current cell as anchor
          if (!selectionStart) {
            setSelectionStart({ row: lastRow, col: lastCol });
          }

          // Calculate range between anchor and new position
          const startRow = selectionStart.row;
          const startCol = selectionStart.col;
          const minRow = Math.min(startRow, newRow);
          const maxRow = Math.max(startRow, newRow);
          const minCol = Math.min(startCol, newCol);
          const maxCol = Math.max(startCol, newCol);

          // Generate the range selection
          const rangeSelection = [];
          for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
              rangeSelection.push(`${row},${col}`);
            }
          }

          setSelectedCells(rangeSelection);
        } else {
          // Regular arrow key just moves to the next cell
          setSelectedCells([newCellId]);
          setSelectionStart(null);
        }

        e.preventDefault(); // Prevent scrolling
      }

      // Ctrl+A to select all cells
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();

        const allCells = [];
        for (let row = 0; row < numberOfRows; row++) {
          for (let col = 0; col < numberOfColumns; col++) {
            allCells.push(`${row},${col}`);
          }
        }

        setSelectedCells(allCells);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCells,
    selectionStart,
    numberOfRows,
    numberOfColumns,
    setSelectedCells,
  ]);

  // Select entire column when header is clicked
  const selectColumn = (columnIndex, event) => {
    event.stopPropagation();

    const columnCells = [];
    for (let row = 0; row < numberOfRows; row++) {
      columnCells.push(`${row},${columnIndex}`);
    }

    if (event.ctrlKey || event.metaKey) {
      // Add/remove this column to/from the existing selection
      const isColumnSelected = columnCells.every((cellId) =>
        selectedCells.includes(cellId)
      );

      if (isColumnSelected) {
        // Remove this column
        setSelectedCells(
          selectedCells.filter((cellId) => !columnCells.includes(cellId))
        );
      } else {
        // Add this column
        setSelectedCells([...selectedCells, ...columnCells]);
      }
    } else {
      // Select just this column
      setSelectedCells(columnCells);
    }
  };

  // Select entire row when header is clicked
  const selectRow = (rowIndex, event) => {
    event.stopPropagation();

    const rowCells = [];
    for (let col = 0; col < numberOfColumns; col++) {
      rowCells.push(`${rowIndex},${col}`);
    }

    if (event.ctrlKey || event.metaKey) {
      // Add/remove this row to/from the existing selection
      const isRowSelected = rowCells.every((cellId) =>
        selectedCells.includes(cellId)
      );

      if (isRowSelected) {
        // Remove this row
        setSelectedCells(
          selectedCells.filter((cellId) => !rowCells.includes(cellId))
        );
      } else {
        // Add this row
        setSelectedCells([...selectedCells, ...rowCells]);
      }
    } else {
      // Select just this row
      setSelectedCells(rowCells);
    }
  };

  // Select all cells when clicking the top-left corner
  const selectAllCells = (event) => {
    event.stopPropagation();

    const allCells = [];
    for (let row = 0; row < numberOfRows; row++) {
      for (let col = 0; col < numberOfColumns; col++) {
        allCells.push(`${row},${col}`);
      }
    }

    setSelectedCells(allCells);
  };

  return (
    <div
      className="relative bg-white shadow-md border overflow-auto w-fit"
      onMouseDown={handleTableMouseDown}
    >
      <table className="border-separate border-spacing-0">
        <tbody>
          {/* Column Headers */}
          <tr>
            <th
              className="w-10 bg-gray-300 select-none cursor-pointer"
              onClick={selectAllCells}
            ></th>{" "}
            {/* Top-left corner cell for "select all" */}
            {[...Array(numberOfColumns)].map((_, columnIndex) => (
              <th
                key={columnIndex}
                className="relative bg-gray-300 border border-gray-400 text-center font-bold select-none cursor-pointer"
                style={{
                  width: columnWidths[columnIndex] || DEFAULT_CELL_WIDTH,
                }}
                onClick={(event) => selectColumn(columnIndex, event)}
              >
                {numberToChar(columnIndex)}
                {/* Column Resizer */}
                <div
                  className="absolute right-0 top-0 h-full w-[1px] bg-gray-500 cursor-col-resize"
                  onMouseDown={(event) =>
                    handleColumnResize(columnIndex, event)
                  }
                ></div>
              </th>
            ))}
          </tr>

          {/* Rows and Cells */}
          {[...Array(numberOfRows)].map((_, rowIndex) => (
            <tr
              key={rowIndex}
              style={{ height: rowHeights[rowIndex] || DEFAULT_CELL_HEIGHT }}
            >
              {/* Row Header */}
              <th
                className="relative bg-gray-300 border border-gray-400 text-center font-bold select-none cursor-pointer"
                style={{ width: "40px" }}
                onClick={(event) => selectRow(rowIndex, event)}
              >
                {rowIndex + 1}
                {/* Row Resizer */}
                <div
                  className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-500 cursor-row-resize"
                  onMouseDown={(event) => handleRowResize(rowIndex, event)}
                ></div>
              </th>

              {/* Cells */}
              {[...Array(numberOfColumns)].map((_, columnIndex) => {
                const cellId = `${rowIndex},${columnIndex}`;
                return (
                  <td
                    key={columnIndex}
                    className="border border-gray-400 relative p-0"
                    style={{
                      width: columnWidths[columnIndex] || DEFAULT_CELL_WIDTH,
                      height: rowHeights[rowIndex] || DEFAULT_CELL_HEIGHT,
                    }}
                    onClick={(event) =>
                      handleCellContainerClick(rowIndex, columnIndex, event)
                    }
                  >
                    <Cell cellId={cellId} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom-Right Resizer */}
      <div
        className="absolute bottom-0 right-0 w-[6px] h-[6px] bg-gray-600 cursor-nwse-resize"
        onMouseDown={handleSheetResize}
      ></div>
    </div>
  );
};

export default Sheet;
