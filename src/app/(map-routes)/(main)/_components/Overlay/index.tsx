"use client";

import React, { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import useOverlayStore from "./store";
import DesktopOverlay from "./DesktopOverlay";
import SmallerDeviceOverlay from "./SmallerDeviceOverlay";

const Overlay = () => {
  const isMediumSizeOrGreater = useMediaQuery({
    query: "(min-width: 768px)",
  });
  const size = useOverlayStore((state) => state.size);
  const setSize = useOverlayStore((state) => state.setSize);

  useEffect(() => {
    if (isMediumSizeOrGreater) {
      setSize("desktop");
    } else {
      setSize("smaller");
    }
  }, [isMediumSizeOrGreater, setSize]);

  return size === "desktop" ? <DesktopOverlay /> : <SmallerDeviceOverlay />;
};

export default Overlay;
