import React from "react";
import { useRecoilState } from "recoil";
import { SheetSizeState } from "../Store/SheetSizeState";

const Resizer = () => {
  const [, setSheetSize] = useRecoilState(SheetSizeState);

  const initDrag = () => {
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const doDrag = (event) => {
    const pointerX = event.pageX;
    const pointerY = event.pageY;

    setSheetSize({
      width: pointerX,
      height: pointerY,
    });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", doDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  return (
    <div
      onMouseDown={initDrag}
      className="w-2 h-2 bg-blue-500 absolute -right-2 -bottom-2 cursor-se-resize"
    />
  );
};

export default Resizer;
