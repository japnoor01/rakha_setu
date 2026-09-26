import React from "react";
import { ThreeDPaper } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame">
      <ThreeDPaper
        variant="original"
      />
    </div>
  );
}

export default Scene;
