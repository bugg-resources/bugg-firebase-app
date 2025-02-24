import { Html, Head, Main, NextScript } from "next/document";
import { useProjectId } from "../data/useProjects";

export default function Document() {
  return (
    <Html className="h-full">
      <Head></Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
