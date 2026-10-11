// @vitest-environment happy-dom
import { it } from "vitest";
it("probe", () => {
  console.log(process.version, typeof localStorage, localStorage === (window as any).localStorage, typeof localStorage?.setItem, Object.getOwnPropertyDescriptor(globalThis, "localStorage"));
  try { localStorage.setItem("a", "1"); console.log("get", localStorage.getItem("a")); } catch (e) { console.log("err", String(e)); }
  console.log(typeof requestAnimationFrame, typeof matchMedia, matchMedia("(prefers-reduced-motion: reduce)").matches, typeof IntersectionObserver);
});
