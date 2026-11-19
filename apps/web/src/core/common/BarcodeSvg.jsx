import React from "react";

// Minimal Code128B pattern table for real scannable SVG barcodes
const CODE128_PATTERNS = [
  "11011001100","11001101100","11001100110","10010011000","10010001100","10001001100",
  "10011001000","10011000100","10001100100","11001001000","11001000100","11000100100",
  "10110011100","10011011100","10011001110","10111001100","10011101100","10011100110",
  "11001110010","11001011100","11001001110","11011100100","11001110100","11101101110",
  "11101001100","11100101100","11100100110","11101100100","11100110100","11100110010",
  "11011011000","11011000110","11000110110","10100011000","10001011000","10001000110",
  "10110001000","10001101000","10001100010","11010001000","11000101000","11000100010",
  "10110111000","10110001110","10001101110","10111011000","10111000110","10001110110",
  "11101110110","11010001110","11000101110","11011101000","11011100010","11011101110",
  "11101011000","11101000110","11100010110","11101101000","11101100010","11100011010",
  "11101111010","11001000010","11110001010","10100110000","10100001100","10010110000",
  "10010000110","10000101100","10000100110","10110010000","10110000100","10011010000",
  "10011000010","10000110100","10000110010","11000010010","11001010000","11110111010",
  "11000010100","10001111010","10100111100","10010111100","10010011110","10111100100",
  "10011110100","10011110010","11110100100","11110010100","11110010010","11011011110",
  "11011110110","11110110110","10101111000","10100011110","10001011110","10111101000",
  "10111100010","11110101000","11110100010","10111011110","10111101110","11101011110",
  "11110101110","11010000100","11010010000","11010011100","1100011101011"
];

function encodeCode128B(text) {
  const clean = String(text || "0000").replace(/[^\x20-\x7E]/g, "");
  let checksum = 104; // Start B
  const codes = [104];
  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    codes.push(val);
    checksum += val * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(106); // Stop
  return codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]).join("");
}

export const BarcodeSvg = ({ value, height = 44 }) => {
  const bits = encodeCode128B(value);
  const bars = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === "1") {
      bars.push(<rect key={i} x={i * 1.5} y={0} width={1.5} height={height} fill="#000" />);
    }
  }
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${bits.length * 1.5} ${height}`} preserveAspectRatio="none">
      {bars}
    </svg>
  );
};

// Deterministic 21x21 QR-style matrix with finder patterns for label preview & print
export const QrSvg = ({ value, size = 96 }) => {
  const str = String(value || "MR-BILAL-POS");
  const n = 21;
  const cells = Array.from({ length: n }, () => Array(n).fill(false));

  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = border || inner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      if (!inFinder) {
        hash ^= (r * 31 + c * 17);
        hash = Math.imul(hash, 16777619);
        cells[r][c] = (hash & 1) === 1;
      }
    }
  }

  const rects = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (cells[r][c]) {
        rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000" />);
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
      <rect width={n} height={n} fill="#fff" />
      {rects}
    </svg>
  );
};
