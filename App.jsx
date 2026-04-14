// ─── Sentence Builder Game ────────────────────────────────────────────────────
// Single-file React app. Works with Vite + Tailwind CSS.
// Install: npm create vite@latest my-app -- --template react
//          npm install tailwindcss @tailwindcss/vite
// Replace src/App.jsx with this file.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ✏️  EDIT THIS ARRAY TO CONTROL THE ENTIRE GAME.
//     Each room: { roomName: string, sentences: string[][] }
//     The game renders ONLY what is defined here — nothing is invented.
// ─────────────────────────────────────────────────────────────────────────────
const ROOMS = [
  {
    roomName: "Library Reception",
    sentences: [
      ["You", "have", "to", "scan", "your", "card", "when", "you", "enter", "the", "library"]
    ]
  },
  {
    roomName: "Study Room",
    sentences: [
      ["You", "have", "to", "be", "quiet", "in", "the", "study", "area"]
    ]
  },
  {
    roomName: "Computer Room",
    sentences: [
      ["You", "don’t", "have", "to", "use", "the", "library", "computers", "you", "can", "bring", "your", "own", "computer"]
    ]
  },
  {
    roomName: "Archieve Section",
    sentences: [
      ["You", "have", "to", "get", "permission", "to", "take", "the", "rare", "books", "from", "the", "archive"]
    ]
  },
  {
    roomName: "Copy Room",
    sentences: [
      ["You", "don’t", "have", "to", "pay", "to", "make", "photocopies"]
    ]
  },
  {
    roomName: "Library Cafe",
    sentences: [
      ["You", "don’t", "have", "to", "be", "quiet", "in", "the", "rest", "area", "but", "you", "have", "to", "eat", "your", "food", "there"]
    ]
  },
  {
    roomName: "Book Registration Desk",
    sentences: [
      ["You", "have", "to", "return", "them", "within", "two", "weeks"]
    ]
  },
  {
    roomName: "Exit Door",
    sentences: [
      ["You", "don’t", "have", "to", "open", "your", "bag", "when", "you", "go", "through", "the", "exit"],
      ["but", "you", "have", "to", "open", "it", "if", "the", "alarm", "goes", "off"]
    ]
  }
];
// ─────────────────────────────────────────────────────────────────────────────

// ── Utilities ─────────────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => String(++_uid);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Build initial word-bank + empty placed arrays for a given room index
const mkRoomState = (ri) => {
  const sents = ROOMS[ri].sentences;
  const bank = shuffle(sents.flatMap((s) => s.map((w) => ({ id: uid(), w }))));
  const placed = sents.map(() => []);
  return { bank, placed };
};

// Imperatively create a floating ghost element that follows the pointer
const spawnGhost = (word, cx, cy, ox, oy) => {
  const el = document.createElement("div");
  el.textContent = word;
  Object.assign(el.style, {
    position: "fixed",
    left: `${cx - ox}px`,
    top: `${cy - oy}px`,
    padding: "10px 22px",
    background: "#1C2B3A",
    color: "#F0EBE3",
    borderRadius: "999px",
    fontFamily: "inherit",
    fontSize: "15px",
    fontWeight: "700",
    pointerEvents: "none",
    zIndex: "9999",
    transform: "rotate(3deg) scale(1.12)",
    boxShadow: "0 12px 32px rgba(28,43,58,0.45)",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
    willChange: "transform,left,top",
    userSelect: "none",
    WebkitUserSelect: "none",
  });
  document.body.appendChild(el);
  return el;
};

// ── Inject global CSS (animations + font) ────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: 'Sora', sans-serif;
  background: #F0EBE3;
  margin: 0;
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
}

[data-draggable] {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  18%      { transform: translateX(-10px); }
  36%      { transform: translateX(10px); }
  54%      { transform: translateX(-6px); }
  72%      { transform: translateX(6px); }
}

@keyframes popIn {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

.anim-shake    { animation: shake 0.48s ease; }
.anim-pop      { animation: popIn 0.38s ease; }
.anim-slideup  { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
.anim-fadein   { animation: fadeIn 0.5s ease both; }
.anim-float    { animation: floatBounce 2.4s ease-in-out infinite; }

/* Door panels */
.door-left  { will-change: transform; transition: transform 440ms cubic-bezier(0.76,0,0.24,1); }
.door-right { will-change: transform; transition: transform 440ms cubic-bezier(0.76,0,0.24,1); }
.door-closed-l { transform: translateX(0); }
.door-open-l   { transform: translateX(-100.5%); }
.door-closed-r { transform: translateX(0); }
.door-open-r   { transform: translateX(100.5%); }
`;

(function injectStyles() {
  if (document.getElementById("sb-global")) return;
  const s = document.createElement("style");
  s.id = "sb-global";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
})();

// ═════════════════════════════════════════════════════════════════════════════
// DoorTransition
// phase: 'open' | 'closing' | 'closed' | 'opening'
// ═════════════════════════════════════════════════════════════════════════════
function DoorTransition({ phase }) {
  const isClosed = phase === "closing" || phase === "closed";
  const isVisible = phase !== "open";

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        pointerEvents: isVisible ? "all" : "none",
      }}
    >
      {/* Left panel */}
      <div
        className={`door-left ${isClosed ? "door-closed-l" : "door-open-l"}`}
        style={{
          width: "50%",
          height: "100%",
          background: "#1C2B3A",
          borderRight: "3px solid #2E4057",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "20px",
          flexShrink: 0,
        }}
      >
        {isClosed && (
          <div style={{ opacity: 0.25, color: "#F0EBE3", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", writingMode: "vertical-rl", fontWeight: 600 }}>
            loading
          </div>
        )}
      </div>

      {/* Right panel */}
      <div
        className={`door-right ${isClosed ? "door-closed-r" : "door-open-r"}`}
        style={{
          width: "50%",
          height: "100%",
          background: "#1C2B3A",
          borderLeft: "3px solid #2E4057",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: "20px",
          flexShrink: 0,
        }}
      >
        {isClosed && (
          <div style={{ opacity: 0.25, color: "#F0EBE3", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", writingMode: "vertical-rl", fontWeight: 600 }}>
            loading
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Timer
// ═════════════════════════════════════════════════════════════════════════════
function Timer({ secs }) {
  return (
    <div
      style={{
        fontSize: "15px",
        fontWeight: 700,
        color: "#C4520A",
        background: "#FEF0E6",
        padding: "7px 16px",
        borderRadius: "999px",
        letterSpacing: "0.08em",
        fontVariantNumeric: "tabular-nums",
        flexShrink: 0,
        border: "1.5px solid #F0C8A8",
      }}
    >
      ⏱ {fmtTime(secs)}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// StartScreen
// ═════════════════════════════════════════════════════════════════════════════
function StartScreen({ onStart }) {
  return (
    <div
      className="anim-fadein"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        gap: "36px",
        textAlign: "center",
      }}
    >
      {/* Hero icon */}
      <div className="anim-float" style={{ fontSize: "72px", lineHeight: 1 }}>
        🚪
      </div>

      {/* Title */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(40px,10vw,64px)",
            fontWeight: 800,
            color: "#1C2B3A",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Sentence
          <br />
          <span style={{ color: "#C4520A" }}>Builder</span>
        </h1>
        <p
          style={{
            color: "#7A6A58",
            fontSize: "16px",
            marginTop: "14px",
            maxWidth: "290px",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          Arrange the scrambled words to unlock each room. Race the clock!
        </p>
      </div>

      {/* Room list preview */}
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {ROOMS.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "11px 16px",
              background: "#FFFFFF",
              borderRadius: "14px",
              border: `1.5px solid ${i === ROOMS.length - 1 ? "#F0C8A8" : "#E0D8CE"}`,
              fontSize: "14px",
              fontWeight: 600,
              color: "#1C2B3A",
              boxShadow: "0 2px 8px rgba(28,43,58,0.06)",
            }}
          >
            <span
              style={{
                fontSize: i === ROOMS.length - 1 ? "16px" : "13px",
                fontWeight: 800,
                color: i === ROOMS.length - 1 ? "#C4520A" : "#AAA090",
                minWidth: "22px",
                textAlign: "center",
              }}
            >
              {i === ROOMS.length - 1 ? "★" : i + 1}
            </span>
            <span>{r.roomName}</span>
            {r.sentences.length > 1 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#C4520A",
                  background: "#FEF0E6",
                  padding: "3px 9px",
                  borderRadius: "999px",
                  flexShrink: 0,
                  border: "1px solid #F0C8A8",
                }}
              >
                ×{r.sentences.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{
          padding: "18px 60px",
          background: "#1C2B3A",
          color: "#F0EBE3",
          border: "none",
          borderRadius: "18px",
          fontSize: "19px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          boxShadow: "0 10px 36px rgba(28,43,58,0.30)",
          letterSpacing: "0.02em",
          transition: "transform .15s ease, box-shadow .15s ease",
        }}
        onPointerEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.04)";
          e.currentTarget.style.boxShadow = "0 16px 44px rgba(28,43,58,0.42)";
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 10px 36px rgba(28,43,58,0.30)";
        }}
      >
        Start Game →
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SentenceZone (DropZone)
// ═════════════════════════════════════════════════════════════════════════════
function SentenceZone({ placed, onRemove, zoneRef, status }) {
  const isErr = status === "error";
  const isOk = status === "success";
  const isOver = status === "over";

  return (
    <div
      ref={zoneRef}
      className={isErr ? "anim-shake" : isOk ? "anim-pop" : ""}
      style={{
        minHeight: "64px",
        padding: "12px 14px",
        borderRadius: "16px",
        border: `2px dashed ${
          isErr ? "#DC2626" : isOk ? "#16A34A" : isOver ? "#C4520A" : "#C8BCA8"
        }`,
        background: isErr
          ? "#FEF2F2"
          : isOk
          ? "#F0FDF4"
          : isOver
          ? "#FFF9F0"
          : "#FAF8F4",
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        transition: "border-color .18s, background .18s",
      }}
    >
      {placed.length === 0 ? (
        <span
          style={{
            color: "#AAA090",
            fontSize: "14px",
            fontStyle: "italic",
            fontWeight: 500,
            pointerEvents: "none",
          }}
        >
          {isOver ? "Release here ✦" : "Drop words here…"}
        </span>
      ) : (
        placed.map((item) => (
          <div
            key={item.id}
            onClick={() => onRemove(item.id)}
            title="Tap to remove"
            style={{
              padding: "10px 18px",
              background: "#FFFFFF",
              color: "#1C2B3A",
              borderRadius: "999px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              border: "1.5px solid #C8BCA8",
              boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              letterSpacing: "0.01em",
              transition: "border-color .15s",
            }}
          >
            {item.w}
            <span style={{ fontSize: "9px", opacity: 0.35, fontWeight: 900 }}>✕</span>
          </div>
        ))
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DraggableWord (word chip in the bank)
// ═════════════════════════════════════════════════════════════════════════════
function DraggableWord({ item, isDragging, onPointerDown }) {
  return (
    <div
      data-draggable="true"
      onPointerDown={onPointerDown}
      style={{
        padding: "10px 20px",
        background: isDragging ? "rgba(200,188,168,0.25)" : "#FFFFFF",
        color: isDragging ? "#AAA090" : "#1C2B3A",
        border: `1.5px solid ${isDragging ? "#C8BCA8" : "#AAA090"}`,
        borderRadius: "999px",
        fontSize: "15px",
        fontWeight: 600,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        boxShadow: isDragging ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
        whiteSpace: "nowrap",
        flexShrink: 0,
        letterSpacing: "0.01em",
        transition: "background .15s, color .15s, box-shadow .15s, border-color .15s",
      }}
    >
      {item.w}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GameRoom
// ═════════════════════════════════════════════════════════════════════════════
function GameRoom({ ri, ws, time, onDrop, onRemove, onCheck, errors, successes }) {
  const room = ROOMS[ri];
  const [draggingId, setDraggingId] = useState(null);
  const [overSi, setOverSi] = useState(null);
  const zoneRefs = useRef([]);
  const bankRef = useRef(null);

  // Find which sentence zone index the pointer is over
  const findSi = useCallback((x, y) => {
    for (let i = 0; i < zoneRefs.current.length; i++) {
      const el = zoneRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }, []);

  // Resolve drop target from final pointer position
  const resolveTarget = useCallback(
    (x, y) => {
      const si = findSi(x, y);
      if (si !== null) return { type: "zone", si };
      if (bankRef.current) {
        const r = bankRef.current.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
          return { type: "bank" };
      }
      return null;
    },
    [findSi]
  );

  // Pointer-down handler — starts drag
  const handlePointerDown = useCallback(
    (e, id, word, srcType, srcSi) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const ghost = spawnGhost(word, e.clientX, e.clientY, ox, oy);
      setDraggingId(id);

      let lx = e.clientX,
        ly = e.clientY;

      const onMove = (ev) => {
        ev.preventDefault();
        lx = ev.clientX;
        ly = ev.clientY;
        ghost.style.left = `${ev.clientX - ox}px`;
        ghost.style.top = `${ev.clientY - oy}px`;
        setOverSi(findSi(ev.clientX, ev.clientY));
      };

      const onUp = () => {
        ghost.remove();
        setDraggingId(null);
        setOverSi(null);
        const tgt = resolveTarget(lx, ly);
        if (tgt) onDrop({ id, word, src: { type: srcType, si: srcSi }, tgt });
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [findSi, resolveTarget, onDrop]
  );

  const allPlaced = ws.bank.length === 0;
  const remaining = ws.bank.length;

  return (
    <div
      className="anim-slideup"
      style={{
        minHeight: "100vh",
        padding: "20px 16px 40px",
        maxWidth: "600px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#AAA090",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Level {ri + 1} / {ROOMS.length}
          </div>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "clamp(22px,6vw,30px)",
              fontWeight: 800,
              color: "#1C2B3A",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
            }}
          >
            {room.roomName}
            {ri === ROOMS.length - 1 ? " ★" : ""}
          </h2>
        </div>
        <Timer secs={time} />
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          height: "4px",
          background: "#D8D2C6",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "999px",
            width: `${(ri / ROOMS.length) * 100}%`,
            background: "linear-gradient(90deg, #C4520A, #E87040)",
            transition: "width .6s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </div>

      {/* ── Sentence zones ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#7A6A58",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {room.sentences.length > 1 ? "Build both sentences" : "Build the sentence"}
        </div>
        {room.sentences.map((_, si) => (
          <SentenceZone
            key={si}
            placed={ws.placed[si] || []}
            zoneRef={(el) => (zoneRefs.current[si] = el)}
            onRemove={(id) => onRemove(id, si)}
            status={
              errors.includes(si)
                ? "error"
                : successes.includes(si)
                ? "success"
                : overSi === si
                ? "over"
                : "idle"
            }
          />
        ))}
      </div>

      {/* ── Word bank ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#7A6A58",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {remaining > 0 ? (
            <>
              Word Bank
              <span
                style={{
                  marginLeft: "10px",
                  color: "#C4520A",
                  background: "#FEF0E6",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 800,
                  border: "1px solid #F0C8A8",
                }}
              >
                {remaining} left
              </span>
            </>
          ) : (
            "Word Bank · All placed!"
          )}
        </div>

        <div
          ref={bankRef}
          style={{
            minHeight: "76px",
            padding: "14px",
            background: "#FFFFFF",
            borderRadius: "20px",
            border: "1.5px solid #C8BCA8",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            boxShadow: "0 2px 12px rgba(28,43,58,0.06)",
          }}
        >
          {ws.bank.length === 0 ? (
            <span
              style={{
                color: "#AAA090",
                fontSize: "14px",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              ✓ All words placed
            </span>
          ) : (
            ws.bank.map((item) => (
              <DraggableWord
                key={item.id}
                item={item}
                isDragging={draggingId === item.id}
                onPointerDown={(e) =>
                  handlePointerDown(e, item.id, item.w, "bank", null)
                }
              />
            ))
          )}
        </div>
      </div>

      {/* ── Hint ── */}
      <p
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#AAA090",
          fontWeight: 500,
          margin: 0,
        }}
      >
        {allPlaced
          ? "All placed — press Check when ready!"
          : "Drag words into the sentence zone • Tap a placed word to remove it"}
      </p>

      {/* ── Check button ── */}
      <button
        onClick={allPlaced ? onCheck : undefined}
        style={{
          padding: "18px",
          background: allPlaced ? "#1C2B3A" : "#D8D2C6",
          color: allPlaced ? "#F0EBE3" : "#AAA090",
          border: "none",
          borderRadius: "16px",
          fontSize: "17px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: allPlaced ? "pointer" : "not-allowed",
          boxShadow: allPlaced ? "0 8px 28px rgba(28,43,58,0.24)" : "none",
          transition: "background .2s, box-shadow .2s, color .2s",
          letterSpacing: "0.02em",
        }}
      >
        {allPlaced
          ? "Check Answer →"
          : `Place ${remaining} more word${remaining !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ResultScreen
// ═════════════════════════════════════════════════════════════════════════════
function ResultScreen({ time, onRestart }) {
  const stars = time < 60 ? 3 : time < 120 ? 2 : 1;
  const medal = stars === 3 ? "🥇" : stars === 2 ? "🥈" : "🥉";
  const msg =
    stars === 3 ? "Blazing fast!" : stars === 2 ? "Well done!" : "Completed!";

  return (
    <div
      className="anim-fadein"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div className="anim-float" style={{ fontSize: "88px", lineHeight: 1 }}>
        {medal}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "36px",
            fontWeight: 800,
            color: "#1C2B3A",
            letterSpacing: "-0.025em",
          }}
        >
          {msg}
        </h2>
        <p style={{ color: "#7A6A58", fontSize: "16px", marginTop: "8px", fontWeight: 500 }}>
          All {ROOMS.length} rooms cleared
        </p>
      </div>

      {/* Time card */}
      <div
        style={{
          padding: "36px 52px",
          background: "#FFFFFF",
          borderRadius: "28px",
          border: "1.5px solid #E0D8CE",
          boxShadow: "0 10px 36px rgba(28,43,58,0.12)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#AAA090",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginBottom: "8px",
          }}
        >
          Total Time
        </div>
        <div
          style={{
            fontSize: "58px",
            fontWeight: 800,
            color: "#C4520A",
            letterSpacing: "0.06em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {fmtTime(time)}
        </div>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              style={{ fontSize: "28px", opacity: s <= stars ? 1 : 0.15 }}
            >
              ⭐
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        style={{
          padding: "17px 48px",
          background: "#1C2B3A",
          color: "#F0EBE3",
          border: "none",
          borderRadius: "16px",
          fontSize: "18px",
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          boxShadow: "0 10px 36px rgba(28,43,58,0.28)",
          letterSpacing: "0.02em",
          transition: "transform .15s ease",
        }}
        onPointerEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Play Again 🔄
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// App — root state machine
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [phase, setPhase] = useState("start"); // 'start' | 'game' | 'result'
  const [ri, setRi] = useState(0);
  const [ws, setWs] = useState(null);
  const [time, setTime] = useState(0);
  const [errors, setErrors] = useState([]);
  const [successes, setSuccesses] = useState([]);
  const [doorPhase, setDoorPhase] = useState("open"); // 'open'|'closing'|'closed'|'opening'
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Trigger door animation, call midpoint() while doors are shut, then open
  const triggerDoor = useCallback((midpoint) => {
    setDoorPhase("closing");
    setTimeout(() => {
      setDoorPhase("closed");
      midpoint();
      setTimeout(() => {
        setDoorPhase("opening");
        setTimeout(() => setDoorPhase("open"), 460);
      }, 90);
    }, 440);
  }, []);

  const startGame = useCallback(() => {
    clearInterval(timerRef.current);
    setRi(0);
    setTime(0);
    setWs(mkRoomState(0));
    setErrors([]);
    setSuccesses([]);
    setPhase("game");
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
  }, []);

  const handleDrop = useCallback(({ id, word, src, tgt }) => {
    setWs((prev) => {
      if (!prev) return prev;
      const bank = [...prev.bank];
      const placed = prev.placed.map((s) => [...s]);

      // Remove from source
      if (src.type === "bank") {
        const idx = bank.findIndex((x) => x.id === id);
        if (idx !== -1) bank.splice(idx, 1);
      } else {
        const idx = placed[src.si]?.findIndex((x) => x.id === id);
        if (idx !== -1) placed[src.si].splice(idx, 1);
      }

      // Add to target
      if (tgt.type === "zone" && placed[tgt.si] !== undefined) {
        placed[tgt.si] = [...placed[tgt.si], { id, w: word }];
      } else if (tgt.type === "bank") {
        bank.push({ id, w: word });
      }

      return { bank, placed };
    });
  }, []);

  const handleRemove = useCallback((id, si) => {
    setWs((prev) => {
      if (!prev) return prev;
      const item = prev.placed[si]?.find((x) => x.id === id);
      if (!item) return prev;
      return {
        bank: [...prev.bank, item],
        placed: prev.placed.map((s, i) =>
          i === si ? s.filter((x) => x.id !== id) : s
        ),
      };
    });
  }, []);

  const handleCheck = useCallback(() => {
    if (!ws) return;
    const sents = ROOMS[ri].sentences;
    const errs = [],
      succs = [];

    sents.forEach((correct, si) => {
      const p = ws.placed[si] || [];
      const ok =
        p.length === correct.length && p.every((item, i) => item.w === correct[i]);
      (ok ? succs : errs).push(si);
    });

    if (errs.length === 0) {
      // ✅ All correct → animate door, then advance
      setSuccesses(succs);
      setTimeout(() => {
        const isLast = ri === ROOMS.length - 1;
        triggerDoor(() => {
          if (isLast) {
            clearInterval(timerRef.current);
            setPhase("result");
          } else {
            const next = ri + 1;
            setRi(next);
            setWs(mkRoomState(next));
            setErrors([]);
            setSuccesses([]);
          }
        });
      }, 500);
    } else {
      // ❌ Shake errors
      setErrors(errs);
      setTimeout(() => setErrors([]), 540);
    }
  }, [ws, ri, triggerDoor]);

  return (
    <div style={{ minHeight: "100vh", background: "#F0EBE3", position: "relative" }}>
      {doorPhase !== "open" && <DoorTransition phase={doorPhase} />}

      {phase === "start" && <StartScreen onStart={startGame} />}

      {phase === "game" && ws && (
        <GameRoom
          key={ri}
          ri={ri}
          ws={ws}
          time={time}
          onDrop={handleDrop}
          onRemove={handleRemove}
          onCheck={handleCheck}
          errors={errors}
          successes={successes}
        />
      )}

      {phase === "result" && (
        <ResultScreen
          time={time}
          onRestart={() => {
            clearInterval(timerRef.current);
            setPhase("start");
          }}
        />
      )}
    </div>
  );
}
