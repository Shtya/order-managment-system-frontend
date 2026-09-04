import { routing } from "../i18n/routing";
import "./[locale]/globals.css";
import NotFoundScreen from "./not-found-screen";

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale}>
      <body style={{ margin: 0 }}>
        <NotFoundScreen />
      </body>
    </html>
  );
}
