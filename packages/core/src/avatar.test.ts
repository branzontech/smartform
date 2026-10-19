import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BoringAvatar from "boring-avatars";
import { describe, expect, it } from "vitest";
import { AVATAR_PALETTE, beamAvatar } from "./avatar";

/** El avatar que pinta la web (boring-avatars) para ese nombre. */
const webMarkup = (name: string) => renderToStaticMarkup(createElement(BoringAvatar, { name, variant: "beam", colors: AVATAR_PALETTE }));

describe("beamAvatar", () => {
  it.each(["Alex Torres Quintero", "Ana María Pérez", "José Ñúñez", "x"])("da el mismo avatar que la web para «%s»", (name) => {
    const a = beamAvatar(name);
    const html = webMarkup(name);
    expect(html).toContain(`fill="${a.backgroundColor}"`);
    expect(html).toContain(`transform="${a.wrapperTransform}" fill="${a.wrapperColor}" rx="${a.isCircle ? 36 : 6}"`);
    expect(html).toContain(`transform="${a.faceTransform}"`);
    expect(html).toContain(`d="${a.mouthPath}"`);
    expect(html).toContain(`x="${a.eyeLeftX}"`);
    expect(html).toContain(`x="${a.eyeRightX}"`);
  });

  it("es estable para el mismo nombre", () => {
    expect(beamAvatar("Ana")).toEqual(beamAvatar("Ana"));
  });
});
