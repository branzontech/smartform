/**
 * Avatar «beam» de boring-avatars 1.11.2 (MIT, © Boring Designers), portado
 * tal cual para dibujarlo fuera del navegador (la app usa react-native-svg).
 * El mismo nombre da el mismo avatar que en Doctor Ker web.
 */

/** Paleta de marca de los avatares (la misma de la web). */
export const AVATAR_PALETTE = ["#A2F603", "#F1E9FC", "#4B1D95", "#D9F7A8", "#C9A7F5"];

/** Lado del lienzo del avatar (viewBox 0 0 36 36). */
export const AVATAR_SIZE = 36;

const hashCode = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash &= hash;
  }
  return Math.abs(hash);
};
const digit = (n: number, place: number) => Math.floor((n / Math.pow(10, place)) % 10);
const bool = (n: number, place: number) => !(digit(n, place) % 2);
const unit = (n: number, range: number, index?: number) => {
  const value = n % range;
  return index && digit(n, index) % 2 === 0 ? -value : value;
};
const pick = (n: number, colors: string[]) => colors[n % colors.length];
const contrast = (hex: string) => {
  const h = hex.replace(/^#/, "");
  const yiq = (299 * parseInt(h.slice(0, 2), 16) + 587 * parseInt(h.slice(2, 4), 16) + 114 * parseInt(h.slice(4, 6), 16)) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
};

export interface BeamAvatar {
  backgroundColor: string;
  wrapperColor: string;
  faceColor: string;
  /** Transformación SVG del fondo de la cara. */
  wrapperTransform: string;
  isCircle: boolean;
  /** Transformación SVG de la cara (ojos y boca). */
  faceTransform: string;
  isMouthOpen: boolean;
  mouthPath: string;
  eyeLeftX: number;
  eyeRightX: number;
}

export function beamAvatar(name: string, colors: string[] = AVATAR_PALETTE): BeamAvatar {
  const n = hashCode(name);
  const wrapperColor = pick(n, colors);
  const preX = unit(n, 10, 1);
  const tx = preX < 5 ? preX + AVATAR_SIZE / 9 : preX;
  const preY = unit(n, 10, 2);
  const ty = preY < 5 ? preY + AVATAR_SIZE / 9 : preY;
  const mouthSpread = unit(n, 3);
  const eyeSpread = unit(n, 5);
  const isMouthOpen = bool(n, 2);
  const faceX = tx > AVATAR_SIZE / 6 ? tx / 2 : unit(n, 8, 1);
  const faceY = ty > AVATAR_SIZE / 6 ? ty / 2 : unit(n, 7, 2);
  return {
    backgroundColor: pick(n + 13, colors),
    wrapperColor,
    faceColor: contrast(wrapperColor),
    wrapperTransform: `translate(${tx} ${ty}) rotate(${unit(n, 360)} 18 18) scale(${1 + unit(n, AVATAR_SIZE / 12) / 10})`,
    isCircle: bool(n, 1),
    faceTransform: `translate(${faceX} ${faceY}) rotate(${unit(n, 10, 3)} 18 18)`,
    isMouthOpen,
    mouthPath: isMouthOpen ? `M15 ${19 + mouthSpread}c2 1 4 1 6 0` : `M13,${19 + mouthSpread} a1,0.75 0 0,0 10,0`,
    eyeLeftX: 14 - eyeSpread,
    eyeRightX: 20 + eyeSpread,
  };
}
