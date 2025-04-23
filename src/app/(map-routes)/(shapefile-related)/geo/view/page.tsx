"use client";
import { useEffect } from "react";
import useOverlayStore from "../../_components/Overlay/store";
import { useSearchParams } from "next/navigation";

const ViewPage = () => {
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

export default ViewPage;
