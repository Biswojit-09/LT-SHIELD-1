import React from "react";

export default function PoleMarker({ poleId, fault = false }) {
  return (
    <div className="pole-marker">

      <img
        src={
          fault
            ? "/electric-pole-fault.png"
            : "/electric-pole-normal.png"
        }
        alt={poleId}
        className="pole-image"
      />

      <div className="pole-label">
        {poleId}
      </div>

    </div>
  );
}