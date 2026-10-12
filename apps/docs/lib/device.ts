/** The phone the kits' frames draw (iPhone 16/17): its logical viewport, and the frame's bezel. Server-safe. */
export const PHONE_VIEWPORT = { width: 390, height: 844 };
export const PHONE_BEZEL = 10;

/** The outer height (px) of a full-screen PhoneFrame at this width: bezel and border included. */
export const phoneFrameHeight = (width: number) => (PHONE_VIEWPORT.height * width) / PHONE_VIEWPORT.width + PHONE_BEZEL * 2 + 2;
