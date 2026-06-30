import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

export const registerPdfFonts = () => {
  if (fontsRegistered) return; // Prevent double registration

  Font.register({
    family: "Cairo",
    fonts: [
      { src: "/fonts/Cairo-ExtraLight.ttf", fontWeight: 200 },
      { src: "/fonts/Cairo-Light.ttf", fontWeight: 300 },
      { src: "/fonts/Cairo-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Cairo-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/Cairo-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/Cairo-Bold.ttf", fontWeight: 700 },
      { src: "/fonts/Cairo-ExtraBold.ttf", fontWeight: 800 },
      { src: "/fonts/Cairo-Black.ttf", fontWeight: 900 },
    ],
  });

  fontsRegistered = true;
};
registerPdfFonts();
