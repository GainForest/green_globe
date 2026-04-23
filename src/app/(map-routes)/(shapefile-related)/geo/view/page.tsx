"use client";
import { Suspense, useEffect } from "react";
import useOverlayStore from "../../_components/Overlay/store";
import { useSearchParams } from "next/navigation";

const GeoView = () => {
  const searchParams = useSearchParams();
  const sourceValue = searchParams.get("source-value") ?? "";
  const overlayVisibility = searchParams.get("overlay-visibility");
  const { setControlsConfig, setVisibility } = useOverlayStore();

  useEffect(() => {
    setControlsConfig({
      mode: "view",
      source: {
        type: "url",
        value: sourceValue,
        dataFormat: "geojson",
      },
    });
    setVisibility(overlayVisibility === "true");
  }, [sourceValue, overlayVisibility, setControlsConfig, setVisibility]);
  return null;
};

const GeoViewPage = () => {
  return (
    <Suspense>
      <GeoView />
    </Suspense>
  );
};

export default GeoViewPage;
