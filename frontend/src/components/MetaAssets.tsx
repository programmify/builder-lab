import faviconImage from "@/assets/favicon.png";
import logoImage from "@/assets/logo.png";
import ogImage from "@/assets/og-image.png";

export const MetaAssets = () => {
  return (
    <>
      <link rel="icon" type="image/png" href={faviconImage} />
      <link rel="apple-touch-icon" href={faviconImage} />
      <meta property="og:image" content={logoImage} />
      <meta property="og:image:alt" content="Programmify logo" />
      <meta name="twitter:image" content={logoImage} />
    </>
  );
};
