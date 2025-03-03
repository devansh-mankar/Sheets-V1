import React from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Footer({
  sheets,
  onAddSheet,
  onSwitchSheet,
  currentSheetId,
  onDeleteSheet,
}) {
  // Ensure sheets is an array before using map
  const sheetsArray = Array.isArray(sheets) ? sheets : [];

  const handleDeleteClick = (e, sheetId) => {
    e.stopPropagation(); // Prevent the click from triggering the parent button
    if (window.confirm("Are you sure you want to delete this sheet?")) {
      onDeleteSheet(sheetId);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-200 border-t border-gray-300 overflow-x-auto">
      <button
        onClick={onAddSheet}
        className="flex items-center px-4 py-2 bg-white rounded-md text-gray-700 hover:bg-gray-100 shrink-0"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Sheet
      </button>

      {sheetsArray.map((sheet) => (
        <div key={sheet._id} className="flex items-center relative">
          <button
            onClick={() => onSwitchSheet(sheet._id)}
            className={`flex items-center justify-between px-4 py-2 rounded-md text-gray-700 text-sm whitespace-nowrap min-w-[100px] ${
              currentSheetId === sheet._id
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            <span className="pr-5">{sheet.name || `Sheet`}</span>
            <span
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              onClick={(e) => handleDeleteClick(e, sheet._id)}
            >
              <XMarkIcon
                className={`w-4 h-4 ${
                  currentSheetId === sheet._id
                    ? "text-white hover:text-gray-200"
                    : "hover:text-gray-900"
                }`}
              />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
