import React from "react";

const Column = ({ children }) => {
  return (
    <td className="min-w-[100px] max-w-[100px] h-[25px] border border-gray-600">
      {children}
    </td>
  );
};

export default Column;
