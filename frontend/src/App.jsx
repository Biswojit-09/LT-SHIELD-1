
import { useEffect, useRef, useState } from "react";
import "./App.css";
import LTNetworkMap from "./LTNetworkMap.jsx";

// ==========================================
// NORMAL ELECTRICAL DATA
// ==========================================
const NORMAL_DATA = {
  voltage_v: 230,
  current_a: 8.2,
  power_kw: 1.8,
  power_factor: 0.95,
  frequency_hz: 50,
  phase_imbalance_pct: 1.5,
};

// ==========================================
// FAULT ELECTRICAL DATA
// ==========================================
const FAULT_DATA = {
  voltage_v: 75.98,
  current_a: 0.418,
  power_kw: 0.01,
  power_factor: 0.313,
  frequency_hz: 50.04,
  phase_imbalance_pct: 54.42,
};

// ==========================================
// LT-003 NETWORK
// ==========================================
const LT_NETWORK = [
  {
    sectionId: "LT-003-S1",
    startPole: "P-001",
    endPole: "P-002",
    start: { lat: 21.4669, lng: 83.9812 },
    end: { lat: 21.4672, lng: 83.9818 },
  },
  {
    sectionId: "LT-003-S2",
    startPole: "P-002",
    endPole: "P-003",
    start: { lat: 21.4672, lng: 83.9818 },
    end: { lat: 21.4677, lng: 83.9823 },
  },
  {
    sectionId: "LT-003-S3",
    startPole: "P-003",
    endPole: "P-004",
    start: { lat: 21.4677, lng: 83.9823 },
    end: { lat: 21.4682, lng: 83.9829 },
  },
  {
    sectionId: "LT-003-S4",
    startPole: "P-004",
    endPole: "P-005",
    start: { lat: 21.4682, lng: 83.9829 },
    end: { lat: 21.4687, lng: 83.9835 },
  },
];

// ==========================================
// INITIAL LT SECTIONS
// ==========================================
const INITIAL_SECTIONS = [
  { id: "LT-001", transformer: "TR-101", status: "NORMAL" },
  { id: "LT-002", transformer: "TR-101", status: "NORMAL" },
  { id: "LT-003", transformer: "TR-102", status: "NORMAL" },
  { id: "LT-004", transformer: "TR-102", status: "WARNING" },
  { id: "LT-005", transformer: "TR-103", status: "NORMAL" },
  { id: "LT-006", transformer: "TR-103", status: "NORMAL" },
];

// ==========================================
// APP
// ==========================================
function App() {
  const [data, setData] = useState(NORMAL_DATA);
  const [prediction, setPrediction] = useState("NORMAL");
  const [confidence, setConfidence] = useState(100);
  const [eventHistory, setEventHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("--");
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [selectedSection, setSelectedSection] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [faultLocation, setFaultLocation] = useState(null);
  const [showFaultMap, setShowFaultMap] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // ==========================================
  // VOICE ALERT CONTROL
  // ==========================================

  const lastSpokenFault = useRef(null);

  const speakFaultAlert = (sectionId) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Browser speech synthesis is not supported.");
      return;
    }

    const message =
      `Warning. An electrical fault has been detected in section ${sectionId}. ` +
      `Please stay away from the restricted zone. ` +
      `Do not approach any electrical line.`;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);

    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
  };

  // ==========================================
  // SEND ELECTRICAL DATA TO AI BACKEND
  // ==========================================
  const predictFault = async (electricalData) => {
    setLoading(true);
    setError("");

    try {
      console.log(
        "Sending electrical data:",
        electricalData
      );

      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            electricalData
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `AI Server Error ${response.status}: ${errorText}`
        );
      }

      const result =
        await response.json();

      console.log(
        "AI RESPONSE:",
        result
      );

      setPrediction(
        result.prediction
      );

      setConfidence(
        result.confidence
      );

      setLastUpdated(
        new Date().toLocaleTimeString()
      );

      const faultDetected =
        result.prediction ===
        "POSSIBLE_BROKEN_LT";

      // ==========================================
      // EVENT HISTORY
      // ==========================================

      setEventHistory(
        (previousEvents) => [
          ...previousEvents,

          {
            id: Date.now(),

            prediction:
              result.prediction,

            time:
              new Date().toLocaleTimeString(),

            section:
              faultDetected
                ? "LT-003"
                : "-",

            confidence:
              result.confidence,
          },
        ]
      );

      // ==========================================
      // FAULT DETECTED
      // ==========================================

      if (faultDetected) {

        console.log(
          "FAULT DETECTED - OPENING MAP"
        );

        const affectedSection =
          "LT-003";

        setSelectedSection(
          affectedSection
        );

        setShowFaultMap(true);

        // ==========================================
        // ESTIMATED FAULT SECTION
        // ==========================================

        const estimatedFault =
          LT_NETWORK.find(
            (section) =>
              section.sectionId ===
              "LT-003-S3"
          );

        console.log(
          "ESTIMATED FAULT:",
          estimatedFault
        );

        setFaultLocation(
          estimatedFault
        );

        // ==========================================
        // AI ANALYSIS
        // ==========================================

        setAiAnalysis({

          voltageDrop: 42,

          phaseImbalance: 31,

          powerFactor: 15,

          currentAnomaly: 12,

          severity: "CRITICAL",

          riskLevel: "HIGH",

          responseTime:
            "Within 30 minutes",

          faultLocation:
            "LT-003-S3",

          faultProbability: 92,

          faultType:
            "Possible conductor or connection fault",

          explanation:
            "Abnormal voltage drop and phase imbalance patterns strongly indicate a possible LT line fault.",

          locationReason:
            "LT-003-S3 shows the strongest abnormal electrical pattern compared with the neighboring LT sections.",

          checks: [
            "Check R-Y-B phase voltage",

            "Check conductor continuity",

            "Inspect connection joints and terminals",

            "Compare sensor readings with adjacent sections",
          ],
        });

        setAlertMessage(
          `Possible broken LT line detected at ${affectedSection}`
        );

        // ==========================================
        // UPDATE SECTION STATUS
        // ==========================================

        setSections(
          (previousSections) =>
            previousSections.map(
              (section) =>
                section.id ===
                affectedSection
                  ? {
                      ...section,
                      status:
                        "POSSIBLE_BROKEN_LT",
                    }
                  : section
            )
        );

        // ==========================================
        // AUTOMATIC VOICE ALERT
        // ==========================================

        const voiceFaultId =
          estimatedFault?.sectionId ||
          "LT-003";

        if (
          lastSpokenFault.current !==
          voiceFaultId
        ) {

          lastSpokenFault.current =
            voiceFaultId;

          // Small delay allows the UI
          // to update before speech starts.
          setTimeout(() => {

            speakFaultAlert(
              voiceFaultId
            );

          }, 300);
        }

      } else {

        // ==========================================
        // NORMAL CONDITION
        // ==========================================

        setSelectedSection(null);

        setFaultLocation(null);

        setShowFaultMap(false);

        setAlertMessage("");

        setAiAnalysis(null);

        setSections(
          INITIAL_SECTIONS
        );

        // Allow the same fault to
        // trigger voice again later.
        lastSpokenFault.current =
          null;

        // Stop any existing voice.
        if (
          "speechSynthesis" in
          window
        ) {
          window.speechSynthesis.cancel();
        }
      }

    } catch (err) {

      console.error(
        "AI SERVER ERROR:",
        err
      );

      setError(
        err.message ||
        "Unable to connect to LT-SHIELD AI server."
      );

    } finally {

      setLoading(false);

    }
  };

  // ==========================================
  // NORMAL CONDITION
  // ==========================================

  const handleNormal = () => {

    setData(
      NORMAL_DATA
    );

    predictFault(
      NORMAL_DATA
    );
  };

  // ==========================================
  // FAULT CONDITION
  // ==========================================

  const handleFault = () => {

    setData(
      FAULT_DATA
    );

    predictFault(
      FAULT_DATA
    );
  };

  // ==========================================
  // GENERATE LIVE NORMAL DATA
  // ==========================================

  const generateLiveData = () => {

    const voltage =
      225 +
      Math.random() * 12;

    const current =
      5 +
      Math.random() * 5;

    const power =
      (voltage *
        current *
        0.92) /
      1000;

    return {

      voltage_v:
        Number(
          voltage.toFixed(2)
        ),

      current_a:
        Number(
          current.toFixed(2)
        ),

      power_kw:
        Number(
          power.toFixed(3)
        ),

      power_factor:
        Number(
          (
            0.90 +
            Math.random() *
              0.08
          ).toFixed(3)
        ),

      frequency_hz:
        Number(
          (
            49.9 +
            Math.random() *
              0.2
          ).toFixed(3)
        ),

      phase_imbalance_pct:
        Number(
          (
            0.5 +
            Math.random() *
              2.5
          ).toFixed(2)
        ),
    };
  };

  // ==========================================
  // AUTOMATIC LIVE MONITORING
  // ==========================================

  useEffect(() => {

    if (!autoMode) {
      return;
    }

    const interval =
      setInterval(() => {

        const liveData =
          generateLiveData();

        setData(
          liveData
        );

        predictFault(
          liveData
        );

      }, 3000);

    return () =>
      clearInterval(
        interval
      );

  }, [autoMode]);

  // ==========================================
  // FAULT STATUS
  // ==========================================

  const isFault =
    prediction ===
    "POSSIBLE_BROKEN_LT";

  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="app">

      {/* ======================================
          HEADER
      ======================================= */}

      <header className="header">

        <div>

          <h1>
            ⚡ LT-SHIELD AI
          </h1>

          <p>
            AI-Powered LT Line Fault Detection System
          </p>

        </div>

        <div className="live">

          <span></span>

          {
            autoMode
              ? "LIVE MONITORING"
              : "SYSTEM ONLINE"
          }

        </div>

      </header>


      {/* ======================================
          SUMMARY CARDS
      ======================================= */}

      <section className="cards">

        <div className="card">

          <h3>
            LT SECTIONS
          </h3>

          <strong>
            128
          </strong>

          <p>
            Total monitored sections
          </p>

        </div>


        <div className="card normal-card">

          <h3>
            NORMAL
          </h3>

          <strong>
            112
          </strong>

          <p>
            Operating normally
          </p>

        </div>


        <div className="card warning-card">

          <h3>
            WARNING
          </h3>

          <strong>
            11
          </strong>

          <p>
            Require attention
          </p>

        </div>


        <div className="card danger-card">

          <h3>
            CRITICAL
          </h3>

          <strong>
            5
          </strong>

          <p>
            Possible faults
          </p>

        </div>

      </section>


      {/* ======================================
          LIVE PARAMETERS
      ======================================= */}

      <section className="section">

        <h2>
          Live Electrical Parameters
        </h2>

        <div className="parameters">

          <div className="parameter">

            <span>
              VOLTAGE
            </span>

            <strong>
              {data.voltage_v.toFixed(2)} V
            </strong>

          </div>


          <div className="parameter">

            <span>
              CURRENT
            </span>

            <strong>
              {data.current_a.toFixed(2)} A
            </strong>

          </div>


          <div className="parameter">

            <span>
              POWER
            </span>

            <strong>
              {data.power_kw.toFixed(3)} kW
            </strong>

          </div>

        </div>

        <p className="update-time">

          Last AI update:

          {" "}

          <strong>
            {lastUpdated}
          </strong>

        </p>

      </section>


      {/* ======================================
          AI STATUS
      ======================================= */}

      <section className="section">

        <h2>
          AI Detection Status
        </h2>

        <div
          className={`status ${
            isFault
              ? "danger"
              : "normal"
          }`}
        >

          <div className="status-icon">

            {
              loading
                ? "..."
                : isFault
                  ? "!"
                  : "✓"
            }

          </div>

          <div>

            <h2>

              {
                loading
                  ? "ANALYZING..."
                  : prediction
              }

            </h2>

            <p>

              AI Confidence:

              {" "}

              <strong>
                {confidence}%
              </strong>

            </p>

          </div>

        </div>

      </section>


      {/* ======================================
          CRITICAL FAULT ALERT
      ======================================= */}

      {alertMessage && (

        <section className="fault-alert">

          <div className="fault-alert-icon">
            ⚠
          </div>

          <div className="fault-alert-content">

            <span>
              CRITICAL AI ALERT
            </span>

            <h2>
              Possible Broken LT Line Detected
            </h2>

            <p>
              {alertMessage}
            </p>

            <div className="fault-details">

              <div>

                <small>
                  LT SECTION
                </small>

                <strong>
                  {selectedSection}
                </strong>

              </div>


              <div>

                <small>
                  AI CONFIDENCE
                </small>

                <strong>
                  {confidence}%
                </strong>

              </div>


              <div>

                <small>
                  TIME
                </small>

                <strong>
                  {lastUpdated}
                </strong>

              </div>

            </div>

          </div>

        </section>

      )}


      {/* ======================================
          AI FAULT ANALYSIS
      ======================================= */}

      {aiAnalysis && (

        <section className="ai-analysis-panel">

          <div className="ai-analysis-header">

            <div>

              <h2>
                🧠 AI Fault Analysis
              </h2>

              <p>
                Why was this fault detected?
              </p>

            </div>

            <div className="ai-critical">

              <span>
                LT-003
              </span>

              <strong>
                🔴 CRITICAL
              </strong>

              <b>
                94%
              </b>

            </div>

          </div>


          {/* VOLTAGE DROP */}

          <div className="analysis-bar">

            <div className="analysis-label">

              <span>
                Voltage Drop
              </span>

              <strong>
                {aiAnalysis.voltageDrop}%
              </strong>

            </div>

            <div className="bar-background">

              <div
                className="bar-fill"
                style={{
                  width:
                    `${aiAnalysis.voltageDrop}%`,
                }}
              ></div>

            </div>

          </div>


          {/* PHASE IMBALANCE */}

          <div className="analysis-bar">

            <div className="analysis-label">

              <span>
                Phase Imbalance
              </span>

              <strong>
                {aiAnalysis.phaseImbalance}%
              </strong>

            </div>

            <div className="bar-background">

              <div
                className="bar-fill"
                style={{
                  width:
                    `${aiAnalysis.phaseImbalance}%`,
                }}
              ></div>

            </div>

          </div>


          {/* POWER FACTOR */}

          <div className="analysis-bar">

            <div className="analysis-label">

              <span>
                Power Factor Change
              </span>

              <strong>
                {aiAnalysis.powerFactor}%
              </strong>

            </div>

            <div className="bar-background">

              <div
                className="bar-fill"
                style={{
                  width:
                    `${aiAnalysis.powerFactor}%`,
                }}
              ></div>

            </div>

          </div>


          {/* CURRENT */}

          <div className="analysis-bar">

            <div className="analysis-label">

              <span>
                Current Anomaly
              </span>

              <strong>
                {aiAnalysis.currentAnomaly}%
              </strong>

            </div>

            <div className="bar-background">

              <div
                className="bar-fill"
                style={{
                  width:
                    `${aiAnalysis.currentAnomaly}%`,
                }}
              ></div>

            </div>

          </div>


          {/* EXPLANATION */}

          <div className="ai-explanation">

            <span>
              ⚠ AI EXPLANATION
            </span>

            <p>
              {aiAnalysis.explanation}
            </p>

          </div>


          {/* FAULT LOCALIZATION */}

          <div className="fault-localization">

            <div className="localization-header">

              <span>
                📍 MOST LIKELY FAULT LOCATION
              </span>

              <strong>
                {aiAnalysis.faultProbability}%
              </strong>

            </div>


            <div className="fault-location-main">

              <div className="location-icon">
                📍
              </div>

              <div>

                <h3>
                  {aiAnalysis.faultLocation}
                </h3>

                <p>
                  {aiAnalysis.faultType}
                </p>

              </div>

            </div>


            <div className="location-reason">

              <strong>
                Why this section?
              </strong>

              <p>
                {aiAnalysis.locationReason}
              </p>

            </div>

          </div>


          {/* INSPECTION GUIDE */}

          <div className="inspection-guide">

            <div className="inspection-title">
              🔍 WHAT TO CHECK
            </div>

            <div className="inspection-list">

              {aiAnalysis.checks.map(
                (check, index) => (

                  <div
                    className="inspection-item"
                    key={index}
                  >

                    <span>
                      {index + 1}
                    </span>

                    <p>
                      {check}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </section>

      )}


      {/* ======================================
          FAULT LOCATION MAP
      ======================================= */}

      {showFaultMap && (

        <section className="network-panel">

          <div className="section-heading">

            <div className="heading-line"></div>

            <div>

              <h2>
                📍 Fault Location
              </h2>

              <p>
                Satellite view of estimated LT fault location
              </p>

            </div>

          </div>

          <LTNetworkMap
            faultLocation={
              faultLocation
            }
          />

        </section>

      )}


      {/* ======================================
          LT SECTION MONITORING
      ======================================= */}

      <section className="section">

        <h2>
          LT Section Monitoring
        </h2>

        <div className="section-grid">

          {sections.map(
            (section) => (

              <div
                key={section.id}
                className={`lt-section-card ${section.status.toLowerCase()}`}
              >

                <div className="section-header">

                  <div>

                    <h3>
                      {section.id}
                    </h3>

                    <p>
                      Transformer:{" "}
                      {section.transformer}
                    </p>

                  </div>

                  <span className="section-dot"></span>

                </div>

                <strong>
                  {section.status}
                </strong>

                <small>
                  AI monitored section
                </small>

              </div>

            )
          )}

        </div>

      </section>


      {/* ======================================
          LIVE LT NETWORK
      ======================================= */}

      <section className="network-panel">

        <div className="section-heading">

          <div className="heading-line"></div>

          <div>

            <h2>
              Live LT Network
            </h2>

            <p>
              Real-time electrical distribution monitoring
            </p>

          </div>

        </div>


        <div className="network">

          {/* TRANSFORMER 101 */}

          <div className="transformer-node">

            ⚡
            <span>
              TR-101
            </span>

          </div>

          <div className="network-line"></div>

          <div className="network-sections">

            <div className="network-node normal">

              <span className="node-dot"></span>
              LT-001

            </div>

            <div className="network-node normal">

              <span className="node-dot"></span>
              LT-002

            </div>

          </div>


          {/* TRANSFORMER 102 */}

          <div className="transformer-node">

            ⚡
            <span>
              TR-102
            </span>

          </div>

          <div className="network-line"></div>

          <div className="network-sections">

            <div
              className={`network-node ${
                selectedSection ===
                "LT-003"
                  ? "critical"
                  : "normal"
              }`}

              style={{
                cursor:
                  selectedSection ===
                  "LT-003"
                    ? "pointer"
                    : "default",
              }}

              onClick={() => {

                if (
                  selectedSection ===
                  "LT-003"
                ) {

                  setShowFaultMap(
                    true
                  );

                }

              }}

            >

              <span className="node-dot"></span>

              <span className="lt-name">
                LT-003
              </span>

              {selectedSection ===
                "LT-003" && (

                <>

                  <span className="fault-pulse"></span>

                  <span className="fault-label">
                    ⚠ FAULT
                  </span>

                </>

              )}

            </div>


            <div className="network-node warning">

              <span className="node-dot"></span>
              LT-004

            </div>

          </div>


          {/* TRANSFORMER 103 */}

          <div className="transformer-node">

            ⚡
            <span>
              TR-103
            </span>

          </div>

          <div className="network-line"></div>

          <div className="network-sections">

            <div className="network-node normal">

              <span className="node-dot"></span>
              LT-005

            </div>

            <div className="network-node normal">

              <span className="node-dot"></span>
              LT-006

            </div>

          </div>

        </div>

      </section>


      {/* ======================================
          AI EVENT HISTORY
      ======================================= */}

      <section className="section">

        <h2>
          AI Event History
        </h2>

        <div className="event-history">

          {eventHistory.length === 0 ? (

            <div className="no-events">
              No AI events recorded yet.
            </div>

          ) : (

            eventHistory
              .slice()
              .reverse()
              .map(
                (event) => (

                  <div
                    key={event.id}
                    className={`event-row ${
                      event.prediction ===
                      "POSSIBLE_BROKEN_LT"
                        ? "event-critical"
                        : "event-normal"
                    }`}
                  >

                    <div className="event-status">

                      {
                        event.prediction ===
                        "POSSIBLE_BROKEN_LT"
                          ? "⚠"
                          : "✓"
                      }

                    </div>

                    <div className="event-info">

                      <strong>
                        {event.prediction}
                      </strong>

                      <span>
                        {event.time}
                      </span>

                    </div>

                    <div className="event-section">

                      <small>
                        LT SECTION
                      </small>

                      <strong>
                        {event.section}
                      </strong>

                    </div>

                    <div className="event-confidence">

                      <small>
                        CONFIDENCE
                      </small>

                      <strong>
                        {event.confidence}%
                      </strong>

                    </div>

                  </div>

                )
              )

          )}

        </div>

      </section>


      {/* ======================================
          ADVANCED PARAMETERS
      ======================================= */}

      <section className="section">

        <h2>
          Advanced Electrical Analysis
        </h2>

        <div className="advanced-grid">

          <div>

            <span>
              POWER FACTOR
            </span>

            <strong>
              {data.power_factor}
            </strong>

          </div>


          <div>

            <span>
              FREQUENCY
            </span>

            <strong>
              {data.frequency_hz} Hz
            </strong>

          </div>


          <div>

            <span>
              PHASE IMBALANCE
            </span>

            <strong>
              {data.phase_imbalance_pct}%
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================
          ERROR
      ======================================= */}

      {error && (

        <div className="alert">

          <h2>
            ⚠ Connection Error
          </h2>

          <p>
            {error}
          </p>

        </div>

      )}


      {/* ======================================
          CONTROLS
      ======================================= */}

      <section className="section">

        <h2>
          LT-SHIELD Controls
        </h2>

        <div className="controls">

          <button
            className="normal-button"
            onClick={handleNormal}
            disabled={loading}
          >
            ✓ Normal Condition
          </button>


          <button
            className="fault-button"
            onClick={handleFault}
            disabled={loading}
          >
            ⚠ Simulate LT Fault
          </button>


          <button
            className="live-button"
            onClick={() =>
              setAutoMode(
                !autoMode
              )
            }
          >

            {
              autoMode
                ? "⏹ Stop Live Monitoring"
                : "▶ Start Live Monitoring"
            }

          </button>

        </div>

      </section>

    </div>
  );
}

export default App;