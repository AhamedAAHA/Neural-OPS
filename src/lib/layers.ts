/** Shared z-index scale — use these class strings so Tailwind can purge correctly. */
export const Z = {
  canvasFx: "z-[5]",
  pageContent: "z-10",
  canvasHud: "z-20",
  sidebar: "z-30",
  topNav: "z-40",
  topNavMenu: "z-50",
  landingNav: "z-50",
  modalBackdrop: "z-[100]",
  modal: "z-[101]",
  toast: "z-[120]",
} as const;
