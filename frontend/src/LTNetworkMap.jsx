import React from "react";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  Circle,
} from "@vis.gl/react-google-maps";


/* ==========================================
   LT NETWORK DATA
========================================== */

const LT_SECTIONS = [
  {
    id: "LT-003-S1",

    startPole: "P-001",
    endPole: "P-002",

    start: {
      lat: 21.4669,
      lng: 83.9812,
    },

    end: {
      lat: 21.4672,
      lng: 83.9818,
    },
  },

  {
    id: "LT-003-S2",

    startPole: "P-002",
    endPole: "P-003",

    start: {
      lat: 21.4672,
      lng: 83.9818,
    },

    end: {
      lat: 21.4677,
      lng: 83.9823,
    },
  },

  {
    id: "LT-003-S3",

    startPole: "P-003",
    endPole: "P-004",

    start: {
      lat: 21.4677,
      lng: 83.9823,
    },

    end: {
      lat: 21.4682,
      lng: 83.9829,
    },
  },

  {
    id: "LT-003-S4",

    startPole: "P-004",
    endPole: "P-005",

    start: {
      lat: 21.4682,
      lng: 83.9829,
    },

    end: {
      lat: 21.4687,
      lng: 83.9835,
    },
  },
];


/* ==========================================
   POLES
========================================== */

const LT_POLES = [
  {
    id: "P-001",
    lat: 21.4669,
    lng: 83.9812,
  },

  {
    id: "P-002",
    lat: 21.4672,
    lng: 83.9818,
  },

  {
    id: "P-003",
    lat: 21.4677,
    lng: 83.9823,
  },

  {
    id: "P-004",
    lat: 21.4682,
    lng: 83.9829,
  },

  {
    id: "P-005",
    lat: 21.4687,
    lng: 83.9835,
  },
];


/* ==========================================
   DISTANCE CALCULATION
========================================== */

function calculateDistance(point1, point2) {

  const R = 6371000;

  const lat1 =
    (point1.lat * Math.PI) / 180;

  const lat2 =
    (point2.lat * Math.PI) / 180;

  const deltaLat =
    ((point2.lat - point1.lat) *
      Math.PI) /
    180;

  const deltaLng =
    ((point2.lng - point1.lng) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


/* ==========================================
   POLE MARKER
========================================== */

function PoleMarker({
  poleId,
  isFault = false,
}) {

  return (
    <div
      style={{
        position: "relative",

        width: "55px",
        height: "75px",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        transform:
          "translateY(-35px)",

        zIndex: isFault
          ? 100
          : 10,

        cursor: "pointer",
      }}
    >

      <img
        src={
          isFault
            ? "/poles/electric-pole-fault.png"
            : "/poles/electric-pole-normal.png"
        }

        alt={
          isFault
            ? `${poleId} Fault`
            : poleId
        }

        title={
          isFault
            ? `${poleId} — FAULT`
            : poleId
        }

        style={{
          width: "55px",

          height: "75px",

          objectFit: "contain",

          display: "block",

          pointerEvents: "auto",
        }}
      />

    </div>
  );
}


/* ==========================================
   DISTANCE MARKER
========================================== */

function DistanceMarker({
  start,
  end,
  distance,
  isFault,
}) {

  const midpoint = {
    lat:
      (start.lat + end.lat) / 2,

    lng:
      (start.lng + end.lng) / 2,
  };

  return (
    <AdvancedMarker
      position={midpoint}
    >

      <div
        style={{
          background:
            "rgba(255,255,255,0.95)",

          color:
            isFault
              ? "#dc2626"
              : "#111827",

          padding: "4px 8px",

          borderRadius: "6px",

          fontSize: "11px",

          fontWeight: "700",

          whiteSpace: "nowrap",

          boxShadow:
            "0 2px 8px rgba(0,0,0,0.4)",

          border:
            isFault
              ? "2px solid #dc2626"
              : "1px solid #9ca3af",

          transform:
            "translate(-50%, -50%)",

          pointerEvents: "none",

          zIndex: 50,
        }}
      >

        {distance.toFixed(1)} m

      </div>

    </AdvancedMarker>
  );
}


/* ==========================================
   MAIN MAP
========================================== */

function LTNetworkMap({
  faultLocation,
}) {

  const apiKey =
    import.meta.env
      .VITE_GOOGLE_MAPS_API_KEY;


  /* ========================================
     FIND FAULT SECTION
  ======================================== */

  const faultSection =
    LT_SECTIONS.find(
      (section) =>
        section.id ===
        faultLocation?.sectionId
    );


  /* ========================================
     FAULT CENTER
     
     IMPORTANT:
     This must be INSIDE the component
     because it uses faultSection.
  ======================================== */

  const faultCenter =
    faultSection
      ? {
          lat:
            (faultSection.start.lat +
              faultSection.end.lat) /
            2,

          lng:
            (faultSection.start.lng +
              faultSection.end.lng) /
            2,
        }
      : null;


  /* ========================================
     MAP CENTER
  ======================================== */

  const center =
    faultSection
      ? {
          lat:
            (faultSection.start.lat +
              faultSection.end.lat) /
            2,

          lng:
            (faultSection.start.lng +
              faultSection.end.lng) /
            2,
        }

      : {
          lat: 21.4677,
          lng: 83.9823,
        };


  /* ========================================
     API KEY CHECK
  ======================================== */

  if (!apiKey) {

    return (
      <div
        style={{
          width: "100%",

          height: "600px",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          background: "#111827",

          color: "white",

          textAlign: "center",

          padding: "20px",
        }}
      >

        <div>

          <h3>
            Google Maps API Key Missing
          </h3>

          <p>
            Add VITE_GOOGLE_MAPS_API_KEY
            to your frontend .env file.
          </p>

        </div>

      </div>
    );
  }


  /* ========================================
     MAP
  ======================================== */

  return (

    <APIProvider apiKey={apiKey}>

      <div
        style={{
          width: "100%",
          height: "600px",

          position: "relative",
        }}
      >

        <Map

          defaultCenter={center}

          defaultZoom={19}

          mapTypeId="satellite"

          streetViewControl={false}

          fullscreenControl={true}

          mapTypeControl={true}

          mapId="DEMO_MAP_ID"
        >


          {/* ==================================
              RESTRICTED / SAFETY ZONE
              
              Appears only when a fault exists.
          ================================== */}

          {faultCenter && (

            <Circle

              center={faultCenter}

              radius={100}

              options={{

                fillColor: "#ff0000",

                fillOpacity: 0.18,

                strokeColor: "#ff0000",

                strokeOpacity: 0.9,

                strokeWeight: 3,

                clickable: false,

                zIndex: 5,

              }}

            />

          )}


          {/* ==================================
              LT WIRES
          ================================== */}

          {LT_SECTIONS.map(
            (section) => {

              const isFault =
                faultSection?.id ===
                section.id;

              return (

                <Polyline

                  key={section.id}

                  path={[
                    section.start,
                    section.end,
                  ]}

                  options={{

                    strokeColor:
                      isFault
                        ? "#ff0000"
                        : "#16a34a",

                    strokeOpacity: 0.9,

                    strokeWeight:
                      isFault
                        ? 8
                        : 5,

                    zIndex:
                      isFault
                        ? 20
                        : 1,

                  }}

                />

              );
            }
          )}


          {/* ==================================
              DISTANCE BETWEEN POLES
          ================================== */}

          {LT_SECTIONS.map(
            (section) => {

              const distance =
                calculateDistance(
                  section.start,
                  section.end
                );

              const isFault =
                faultSection?.id ===
                section.id;

              return (

                <DistanceMarker

                  key={
                    `distance-${section.id}`
                  }

                  start={section.start}

                  end={section.end}

                  distance={distance}

                  isFault={isFault}

                />

              );
            }
          )}


          {/* ==================================
              POLES
          ================================== */}

          {LT_POLES.map(
            (pole) => {

              /*
               * Only the END POLE of the
               * fault section becomes
               * the fault pole.
               */

              const isFault =
                faultSection?.endPole ===
                pole.id;

              return (

                <AdvancedMarker

                  key={pole.id}

                  position={{
                    lat: pole.lat,
                    lng: pole.lng,
                  }}

                  title={
                    isFault
                      ? `${pole.id} — FAULT`
                      : pole.id
                  }

                >

                  <PoleMarker

                    poleId={pole.id}

                    isFault={isFault}

                  />

                </AdvancedMarker>

              );

            }
          )}


          {/* ==================================
              FAULT CENTER MARKER
              
              Shows exact estimated fault
              position inside the restricted
              zone.
          ================================== */}

          {faultCenter && (

            <AdvancedMarker
              position={faultCenter}
            >

              <div
                style={{
                  width: "32px",

                  height: "32px",

                  borderRadius: "50%",

                  background:
                    "rgba(220,38,38,0.9)",

                  border:
                    "4px solid rgba(255,255,255,0.9)",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  color: "white",

                  fontSize: "16px",

                  fontWeight: "900",

                  boxShadow:
                    "0 2px 10px rgba(0,0,0,0.5)",

                  transform:
                    "translate(-50%, -50%)",

                  pointerEvents: "none",

                  zIndex: 200,

                }}
              >
                !
              </div>

            </AdvancedMarker>

          )}

        </Map>

      </div>

    </APIProvider>
  );
}


export default LTNetworkMap;