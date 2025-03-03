import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { RecoilRoot } from "recoil";
import SheetContainer from "../Containers/SheetsContainer";
import Footer from "../components/Footer";
import DataHeader from "../components/DataHeader";
import API_BASE_URL from "../config.js";

export default function Home() {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [activeSheetName, setActiveSheetName] = useState("");
  const [sheetData, setSheetData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // Track if we're currently switching sheets to prevent data corruption
  const [isSwitchingSheets, setIsSwitchingSheets] = useState(false);

  // Fetch sheets from backend
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/sheets/`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 403) {
            console.error("Access forbidden. You may need to log in again.");
          } else {
            console.error(`Error: ${response.status} - ${response.statusText}`);
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success && data.sheets) {
          setSheets(data.sheets);
          if (data.sheets.length > 0) {
            const firstSheetId = data.sheets[0]._id;
            setActiveSheet(firstSheetId);
            setActiveSheetName(data.sheets[0].name);
            await fetchSheetData(firstSheetId);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sheets:", error);
        setIsLoading(false);
      }
    };

    fetchSheets();
  }, []);

  // Fetch data for a specific sheet directly from server
  // Update fetchSheetData in Home.js to better handle the response
  const fetchSheetData = async (sheetId) => {
    if (!sheetId) return;

    try {
      setIsLoading(true);
      console.log(`Fetching data for sheet: ${sheetId}`);

      const response = await fetch(`${API_BASE_URL}/api/sheets/${sheetId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        setIsLoading(false);
        setSheetData({}); // Ensure data is cleared on error
        return;
      }

      const data = await response.json();
      if (data.success && data.sheet) {
        console.log(`Data received for sheet ${sheetId}:`, data.sheet.data);

        // Wait for state update to complete
        await new Promise((resolve) => {
          setSheetData(data.sheet.data || {});
          setTimeout(resolve, 0);
        });

        setActiveSheetName(data.sheet.name);
      } else {
        console.error("Failed to get sheet data or sheet is empty");
        setSheetData({});
      }
      setIsLoading(false);
    } catch (error) {
      console.error(`Error fetching sheet data for ${sheetId}:`, error);
      setSheetData({});
      setIsLoading(false);
    }
  };

  // Create a new sheet in backend
  const addNewSheet = async () => {
    try {
      // Prevent interactions during operation
      setIsLoading(true);
      setIsSwitchingSheets(true);

      // Save current sheet data before creating a new one
      if (activeSheet) {
        await saveSheetData(activeSheet, activeSheetName);
      }

      const response = await fetch(`${API_BASE_URL}/api/sheets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: `Sheet ${sheets.length + 1}` }),
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        setIsLoading(false);
        setIsSwitchingSheets(false);
        return null;
      }

      const data = await response.json();
      if (data.success && data.sheet) {
        // Update the sheets list
        setSheets((prevSheets) => [...prevSheets, data.sheet]);

        // Important: Clear data before changing the active sheet
        setSheetData({});

        // Set the new active sheet
        setActiveSheet(data.sheet._id);
        setActiveSheetName(data.sheet.name);

        setIsLoading(false);
        setIsSwitchingSheets(false);
        return data.sheet._id;
      }
      setIsLoading(false);
      setIsSwitchingSheets(false);
    } catch (error) {
      console.error("Error creating sheet:", error);
      setIsLoading(false);
      setIsSwitchingSheets(false);
    }
    return null;
  };

  // Save sheet data to backend
  const saveSheetData = async (sheetId, sheetName) => {
    if (!sheetId) return;

    try {
      setIsLoading(true);
      console.log(`Saving data for sheet ${sheetId}:`, sheetData);

      const response = await fetch(`${API_BASE_URL}/api/sheets/${sheetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: sheetName,
          data: sheetData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Update sheets list with new name
        setSheets((prevSheets) =>
          prevSheets.map((sheet) =>
            sheet._id === sheetId ? { ...sheet, name: sheetName } : sheet
          )
        );

        console.log(`Sheet ${sheetId} saved successfully`);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving sheet:", error);
      setIsLoading(false);
    }
  };

  // Handle data updates from the grid
  const handleDataUpdate = (newData) => {
    // Only update data if we're not in the middle of switching sheets
    if (!isSwitchingSheets) {
      setSheetData(newData);
    }
  };

  // Handle switching sheets
  // Modify handleSwitchSheet in Home.js
  const handleSwitchSheet = async (sheetId) => {
    if (sheetId !== activeSheet && !isSwitchingSheets) {
      try {
        // Set switching flag to prevent data updates during transition
        setIsSwitchingSheets(true);
        setIsLoading(true);

        // First save the current sheet's data
        if (activeSheet) {
          await saveSheetData(activeSheet, activeSheetName);
        }

        // Clear current sheet data completely before switching
        setSheetData({});

        // Set the new active sheet
        setActiveSheet(sheetId);

        // Get the sheet name from sheets array
        const selectedSheet = sheets.find((sheet) => sheet._id === sheetId);
        if (selectedSheet) {
          setActiveSheetName(selectedSheet.name);
        }

        // Only fetch new data after clearing previous data
        await fetchSheetData(sheetId);

        // Allow data updates again
        setIsSwitchingSheets(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error switching sheets:", error);
        setIsSwitchingSheets(false);
        setIsLoading(false);
      }
    }
  };
  // Delete a sheet
  const deleteSheet = async (sheetId) => {
    try {
      setIsLoading(true);
      setIsSwitchingSheets(true);

      const response = await fetch(`${API_BASE_URL}/api/sheets/${sheetId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        setIsLoading(false);
        setIsSwitchingSheets(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Remove the deleted sheet from state
        const updatedSheets = sheets.filter((sheet) => sheet._id !== sheetId);
        setSheets(updatedSheets);

        // If the active sheet was deleted, switch to another sheet
        if (activeSheet === sheetId) {
          // Clear data immediately
          setSheetData({});

          if (updatedSheets.length > 0) {
            const newActiveSheet = updatedSheets[0]._id;
            setActiveSheet(newActiveSheet);
            setActiveSheetName(updatedSheets[0].name);
            // Load the new active sheet data
            await fetchSheetData(newActiveSheet);
          } else {
            setActiveSheet(null);
            setActiveSheetName("");
          }
        }
      }
      setIsLoading(false);
      setIsSwitchingSheets(false);
    } catch (error) {
      console.error("Error deleting sheet:", error);
      setIsLoading(false);
      setIsSwitchingSheets(false);
    }
  };

  return (
    <RecoilRoot>
      <div className="bg-gray-100 min-h-screen flex flex-col">
        {/* Main header with fixed position */}
        <div className="fixed top-0 left-0 right-0 z-10">
          <Header />
        </div>

        {/* Data header positioned below the main header */}
        <div className="fixed top-16 mb-4 mx-2 left-0 right-0 z-[5]">
          <DataHeader
            activeSheetId={activeSheet}
            activeSheetName={activeSheetName}
            onSaveSheet={saveSheetData}
          />
        </div>

        {/* Main content with proper padding to avoid overlapping with headers */}
        <div className="flex-1 pt-32 pb-16 px-4">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="overflow-auto whitespace-nowrap border rounded-lg bg-white shadow-md p-2 h-full">
            {activeSheet && (
              <SheetContainer
                key={`sheet-container-${activeSheet}`} // Simplify the key
                sheetId={activeSheet}
                initialData={sheetData}
                onDataUpdate={handleDataUpdate}
                disabled={isSwitchingSheets}
              />
            )}
          </div>
        </div>

        {/* Footer with fixed position */}
        <div className="fixed bottom-0 left-0 right-0">
          <Footer
            sheets={sheets}
            activeSheet={activeSheet}
            currentSheetId={activeSheet}
            onAddSheet={addNewSheet}
            onSwitchSheet={handleSwitchSheet}
            onDeleteSheet={deleteSheet}
            disabled={isSwitchingSheets || isLoading}
          />
        </div>
      </div>
    </RecoilRoot>
  );
}
