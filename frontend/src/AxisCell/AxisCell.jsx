import React from "react";

const AxisCell = ({ children }) => {
  return (
    <th className="text-center bg-gray-300 p-1 border border-gray-600">
      {children}
    </th>
  );
};

export default AxisCell;
