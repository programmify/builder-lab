// Import assets to ensure they get bundled
import faviconImage from "@/assets/favicon.png";
import ogImage from "@/assets/og-image.png";

// Export the asset URLs so they can be used in HTML
export { faviconImage, ogImage };

// This component doesn't render anything, just ensures assets are bundled
export const MetaAssets = () => {
  return null;
};
