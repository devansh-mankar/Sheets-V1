import React, { useState } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { CellValueState } from "../Store/CellValueState.js";
import { SelectedCellsState } from "../Store/SelectedCellsState.js";
import { handleError, handleSuccess } from "../utilsToast.js";
import { ToastContainer } from "react-toastify";

const DataHeader = () => {
  const selectedCells = useRecoilValue(SelectedCellsState);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Existing handlers remain unchanged
  const handleTrim = useRecoilCallback(({ snapshot, set }) => async () => {
    if (selectedCells.length === 0) {
      return handleError("Please select cells to apply the TRIM function");
    }

    for (const cellId of selectedCells) {
      const cellValue = await snapshot.getPromise(CellValueState(cellId));
      if (typeof cellValue === "string") {
        set(CellValueState(cellId), cellValue.trim());
      }
    }
  });

  const handleUpperCase = useRecoilCallback(({ snapshot, set }) => async () => {
    if (selectedCells.length === 0) {
      return handleError("Please select cells to apply the UPPER function");
    }

    for (const cellId of selectedCells) {
      const cellValue = await snapshot.getPromise(CellValueState(cellId));
      if (typeof cellValue === "string") {
        set(CellValueState(cellId), cellValue.toUpperCase());
      }
    }
  });

  const handleLowerCase = useRecoilCallback(({ snapshot, set }) => async () => {
    if (selectedCells.length === 0) {
      return handleError("Please select cells to apply the LOWER function");
    }

    for (const cellId of selectedCells) {
      const cellValue = await snapshot.getPromise(CellValueState(cellId));
      if (typeof cellValue === "string") {
        set(CellValueState(cellId), cellValue.toLowerCase());
      }
    }
  });

  const handleRemoveDuplicates = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        if (selectedCells.length === 0) {
          return handleError(
            "Please select a range of cells to remove duplicates"
          );
        }

        // We need to group cells by rows
        const cellsByRows = {};
        for (const cellId of selectedCells) {
          // Assuming cellId format is like "row-col"
          const [row, col] = cellId.split("-");
          if (!cellsByRows[row]) {
            cellsByRows[row] = [];
          }
          cellsByRows[row].push({ cellId, col });
        }

        // Get values for all selected cells
        const rowsValues = [];
        for (const row in cellsByRows) {
          const columns = cellsByRows[row].sort((a, b) => a.col - b.col);
          const rowValues = [];

          for (const { cellId } of columns) {
            const value = await snapshot.getPromise(CellValueState(cellId));
            rowValues.push(value);
          }

          rowsValues.push({ row, values: rowValues.join(",") });
        }

        // Find unique rows
        const uniqueRows = new Set();
        const duplicateRows = new Set();

        rowsValues.forEach(({ row, values }) => {
          if (uniqueRows.has(values)) {
            duplicateRows.add(row);
          } else {
            uniqueRows.add(values);
          }
        });

        // Clear duplicate rows
        if (duplicateRows.size > 0) {
          for (const row of duplicateRows) {
            for (const { cellId } of cellsByRows[row]) {
              set(CellValueState(cellId), "");
            }
          }
          handleSuccess(`Removed ${duplicateRows.size} duplicate rows`);
        } else {
          handleError("No duplicates found");
        }
      }
  );

  const handleFindReplace = useRecoilCallback(
    ({ snapshot, set }) =>
      async (findText, replaceText) => {
        if (selectedCells.length === 0) {
          return handleError("Please select cells for find and replace");
        }

        if (!findText) {
          return handleError("Please enter text to find");
        }

        let replacedCount = 0;

        for (const cellId of selectedCells) {
          const cellValue = await snapshot.getPromise(CellValueState(cellId));
          if (typeof cellValue === "string" && cellValue.includes(findText)) {
            const newValue = cellValue.replaceAll(findText, replaceText);
            set(CellValueState(cellId), newValue);
            replacedCount++;
          }
        }

        handleError(`Replaced ${replacedCount} occurrences`);
      }
  );

  const handleProperCase = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        if (selectedCells.length === 0) {
          return handleError(
            "Please select cells to apply the PROPER function"
          );
        }

        for (const cellId of selectedCells) {
          const cellValue = await snapshot.getPromise(CellValueState(cellId));
          if (typeof cellValue === "string") {
            const properValue = cellValue
              .toLowerCase()
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            set(CellValueState(cellId), properValue);
          }
        }
      }
  );

  const handleRemoveSpaces = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        if (selectedCells.length === 0) {
          return handleError("Please select cells to remove spaces");
        }

        for (const cellId of selectedCells) {
          const cellValue = await snapshot.getPromise(CellValueState(cellId));
          if (typeof cellValue === "string") {
            set(CellValueState(cellId), cellValue.replace(/\s+/g, ""));
          }
        }
      }
  );

  // All other states and handlers remain the same
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationType, setValidationType] = useState("email");

  const handleDataValidation = useRecoilCallback(
    ({ snapshot }) =>
      async (type) => {
        if (selectedCells.length === 0) {
          return handleError("Please select cells to validate");
        }

        let validCount = 0;
        let invalidCount = 0;
        let pattern;

        switch (type) {
          case "email":
            pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            break;
          case "phone":
            pattern = /^[\d\s()\-+]+$/;
            break;
          case "date":
            pattern = /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}$/;
            break;
          case "url":
            pattern =
              /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            break;
          default:
            pattern = /^.+$/;
        }

        for (const cellId of selectedCells) {
          const cellValue = await snapshot.getPromise(CellValueState(cellId));
          if (typeof cellValue === "string") {
            const isValid = pattern.test(cellValue);

            if (isValid) {
              validCount++;
            } else {
              invalidCount++;
            }
          }
        }

        handleError(
          `Validation results: ${validCount} valid, ${invalidCount} invalid cells`
        );
      }
  );

  const [extractOpen, setExtractOpen] = useState(false);
  const [extractType, setExtractType] = useState("first_word");

  const handleExtract = useRecoilCallback(
    ({ snapshot, set }) =>
      async (type) => {
        if (selectedCells.length === 0) {
          return handleError("Please select cells to extract from");
        }

        for (const cellId of selectedCells) {
          const cellValue = await snapshot.getPromise(CellValueState(cellId));
          if (typeof cellValue === "string") {
            let result = "";

            switch (type) {
              case "first_word":
                result = cellValue.trim().split(/\s+/)[0] || "";
                break;
              case "last_word": {
                const words = cellValue.trim().split(/\s+/);
                result = words[words.length - 1] || "";
                break;
              }
              case "numbers_only":
                result = cellValue.replace(/[^0-9.]/g, "");
                break;
              case "letters_only":
                result = cellValue.replace(/[^a-zA-Z]/g, "");
                break;
              default:
                result = cellValue;
            }

            set(CellValueState(cellId), result);
          }
        }
      }
  );

  const handleConcatenate = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        if (selectedCells.length <= 1) {
          return handleError("Please select at least two cells to concatenate");
        }

        // Group cells by rows
        const cellsByRows = {};
        for (const cellId of selectedCells) {
          const [row, col] = cellId.split("-");
          if (!cellsByRows[row]) {
            cellsByRows[row] = [];
          }
          cellsByRows[row].push({ cellId, col });
        }

        // Process each row
        for (const row in cellsByRows) {
          const columns = cellsByRows[row].sort((a, b) => a.col - b.col);
          const values = [];

          // Get values for all cells in this row
          for (const { cellId } of columns) {
            const value = await snapshot.getPromise(CellValueState(cellId));
            values.push(value || "");
          }

          // Set the concatenated value to the last cell in the row
          const lastCellId = columns[columns.length - 1].cellId;
          set(CellValueState(lastCellId), values.join(""));
        }
      }
  );

  const [splitOpen, setSplitOpen] = useState(false);
  const [splitDelimiter, setSplitDelimiter] = useState(",");

  const handleTextSplit = useRecoilCallback(
    ({ snapshot, set }) =>
      async (delimiter) => {
        if (selectedCells.length === 0) {
          return alert("Please select cells to split");
        }

        // Group cells by rows
        const cellsByRows = {};
        for (const cellId of selectedCells) {
          const [row, col] = cellId.split("-");
          if (!cellsByRows[row]) {
            cellsByRows[row] = [];
          }
          cellsByRows[row].push({ cellId, col: parseInt(col) });
        }

        // Process each row
        for (const row in cellsByRows) {
          const columns = cellsByRows[row].sort((a, b) => a.col - b.col);

          // Get the first cell's value for splitting
          const firstCellId = columns[0].cellId;
          const firstCellValue = await snapshot.getPromise(
            CellValueState(firstCellId)
          );

          if (typeof firstCellValue === "string") {
            const parts = firstCellValue.split(delimiter);

            // Place parts in consecutive cells
            for (let i = 0; i < Math.min(parts.length, columns.length); i++) {
              set(CellValueState(columns[i].cellId), parts[i].trim());
            }
          }
        }
      }
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearSheet = useRecoilCallback(({ set }) => async () => {
    if (selectedCells.length === 0) {
      return handleError("No cells selected to clear");
    }

    for (const cellId of selectedCells) {
      set(CellValueState(cellId), "");
    }

    handleSuccess("Sheet cleared successfully");
    setShowClearConfirm(false);
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentSheetId, setCurrentSheetId] = useState(null);
  const [sheetName, setSheetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openSaveModal = useRecoilCallback(() => async () => {
    // If we have a current sheet ID, load its name
    if (currentSheetId) {
      setSheetName(/* current sheet name if you track it */);
    } else {
      setSheetName("");
    }

    setShowSaveModal(true);
  });

  const handleUpdateSheet = useRecoilCallback(({ snapshot }) => async () => {
    if (!currentSheetId) {
      return handleSaveSheet(); // If no sheet ID, create a new one instead
    }

    if (!sheetName.trim()) {
      return handleError("Please enter a name for your sheet");
    }

    try {
      setIsSaving(true);

      // Collect data from cells
      const cellData = {};
      const cellsToSave = selectedCells.length > 0 ? selectedCells : [];

      if (cellsToSave.length === 0) {
        return handleError(
          "No data to save. Please select cells or add data to your sheet"
        );
      }

      for (const cellId of cellsToSave) {
        const cellValue = await snapshot.getPromise(CellValueState(cellId));
        cellData[cellId] = cellValue;
      }

      // Update existing sheet in database
      const response = await fetch(`/api/sheets/${currentSheetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sheetName,
          data: cellData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update sheet");
      }

      handleSuccess(
        result.message || `Sheet "${sheetName}" updated successfully`
      );
      setShowSaveModal(false);
    } catch (error) {
      handleError(`Error updating sheet: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  });

  const handleSaveSheet = useRecoilCallback(({ snapshot }) => async () => {
    if (!sheetName.trim()) {
      return handleError("Please enter a name for your sheet");
    }

    try {
      setIsSaving(true);

      // Collect data from cells
      const cellData = {};
      const cellsToSave = selectedCells.length > 0 ? selectedCells : [];

      if (cellsToSave.length === 0) {
        return handleError(
          "No data to save. Please select cells or add data to your sheet"
        );
      }

      for (const cellId of cellsToSave) {
        const cellValue = await snapshot.getPromise(CellValueState(cellId));
        cellData[cellId] = cellValue;
      }

      // Use the full URL to your API server
      const response = await fetch("http://localhost:8080/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Important: include credentials to send cookies for authentication
        credentials: "include",
        body: JSON.stringify({
          name: sheetName,
          data: cellData,
        }),
      });

      // Rest of your function remains the same
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Server responded with status: ${response.status}. Details: ${errorText}`
        );
      }

      const result = await response.json();

      handleSuccess(
        result.message || `Sheet "${sheetName}" saved successfully`
      );
      setCurrentSheetId(result.sheet?._id);
      setShowSaveModal(false);
    } catch (error) {
      console.error("Full error:", error);
      handleError(`Error saving sheet: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div className="bg-gray-100 border-b border-gray-300 p-2 flex flex-wrap items-center justify-between h-auto min-h-12 top-16 z-40 shadow-2xl relative">
      {/* Title and toolbar in a single line */}
      <div className="flex items-center w-full">
        {/* Title */}
        <div className="text-lg font-semibold mr-4">Data Quality Tools</div>

        {/* Main data quality tools - in same line as heading */}
        <div className="flex flex-wrap items-center space-x-2 overflow-x-auto flex-grow">
          <button
            onClick={handleTrim}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            title="Remove leading and trailing whitespace"
          >
            TRIM
          </button>

          <button
            onClick={handleUpperCase}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            title="Convert text to uppercase"
          >
            UPPER
          </button>

          <button
            onClick={handleLowerCase}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            title="Convert text to lowercase"
          >
            LOWER
          </button>

          <button
            onClick={handleRemoveDuplicates}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            title="Remove duplicate rows"
          >
            REMOVE DUPLICATES
          </button>

          <button
            onClick={() => setFindReplaceOpen(!findReplaceOpen)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            title="Find and replace text"
          >
            FIND & REPLACE
          </button>

          <button
            onClick={handleProperCase}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            title="Capitalize first letter of each word"
          >
            PROPER
          </button>

          <button
            onClick={handleRemoveSpaces}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            title="Remove all spaces"
          >
            REMOVE SPACES
          </button>

          <button
            onClick={() => setValidationOpen(!validationOpen)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            title="Validate data formats"
          >
            VALIDATE
          </button>

          <button
            onClick={() => setExtractOpen(!extractOpen)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            title="Extract parts of text"
          >
            EXTRACT
          </button>

          <button
            onClick={handleConcatenate}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            title="Join selected cells"
          >
            CONCATENATE
          </button>

          <button
            onClick={() => setSplitOpen(!splitOpen)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            title="Split text into columns"
          >
            SPLIT
          </button>
        </div>

        {/* Save and Clear buttons - at the end of the row */}
        <div className="flex ml-2 space-x-2 shrink-0">
          <button
            onClick={openSaveModal}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
            title="Save sheet to database"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center"
            title="Clear all data in the current sheet"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* All dialogs remain unchanged */}
      {findReplaceOpen && (
        <div className="absolute top-16 right-2 bg-white shadow-md border border-gray-300 p-3 rounded z-50">
          <div className="mb-2">
            <label className="block text-sm mb-1">Find:</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="border border-gray-300 p-1 rounded w-full"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm mb-1">Replace with:</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="border border-gray-300 p-1 rounded w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setFindReplaceOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleFindReplace(findText, replaceText);
                setFindReplaceOpen(false);
                setFindText("");
                setReplaceText("");
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {validationOpen && (
        <div className="absolute top-16 right-2 bg-white shadow-md border border-gray-300 p-3 rounded z-50">
          <div className="mb-2">
            <label className="block text-sm mb-1">Validation Type:</label>
            <select
              value={validationType}
              onChange={(e) => setValidationType(e.target.value)}
              className="border border-gray-300 p-1 rounded w-full"
            >
              <option value="email">Email Address</option>
              <option value="phone">Phone Number</option>
              <option value="date">Date</option>
              <option value="url">URL</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setValidationOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDataValidation(validationType);
                setValidationOpen(false);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
            >
              Validate
            </button>
          </div>
        </div>
      )}

      {extractOpen && (
        <div className="absolute top-16 right-2 bg-white shadow-md border border-gray-300 p-3 rounded z-50">
          <div className="mb-2">
            <label className="block text-sm mb-1">Extract:</label>
            <select
              value={extractType}
              onChange={(e) => setExtractType(e.target.value)}
              className="border border-gray-300 p-1 rounded w-full"
            >
              <option value="first_word">First Word</option>
              <option value="last_word">Last Word</option>
              <option value="numbers_only">Numbers Only</option>
              <option value="letters_only">Letters Only</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setExtractOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleExtract(extractType);
                setExtractOpen(false);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
            >
              Extract
            </button>
          </div>
        </div>
      )}

      {splitOpen && (
        <div className="absolute top-16 right-2 bg-white shadow-md border border-gray-300 p-3 rounded z-50">
          <div className="mb-2">
            <label className="block text-sm mb-1">Split by:</label>
            <input
              type="text"
              value={splitDelimiter}
              onChange={(e) => setSplitDelimiter(e.target.value)}
              className="border border-gray-300 p-1 rounded w-full"
              placeholder="Enter delimiter (e.g. ,)"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setSplitOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleTextSplit(splitDelimiter);
                setSplitOpen(false);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
            >
              Split
            </button>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">Clear Sheet</h3>
            <p className="mb-4">
              Are you sure you want to clear all data from the current sheet?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSheet}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Clear Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">
              {currentSheetId ? "Update Sheet" : "Save Sheet to Database"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm mb-1 font-medium">
                Sheet Name:
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Enter a name for your sheet"
                className="border border-gray-300 p-2 rounded w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded text-sm"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={currentSheetId ? handleUpdateSheet : handleSaveSheet}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {currentSheetId ? "Updating..." : "Saving..."}
                  </>
                ) : currentSheetId ? (
                  "Update Sheet"
                ) : (
                  "Save Sheet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default DataHeader;
