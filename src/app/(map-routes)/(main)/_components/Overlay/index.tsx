"use client";

import React, { useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import useOverlayStore from "./store";
import DesktopOverlay from "./DesktopOverlay";
import SmallerDeviceOverlay from "./SmallerDeviceOverlay";

const Overlay = () => {
  const isMediumSizeOrGreater = useMediaQuery({ query: "(width >= 48rem)" });
  const setSize = useOverlayStore((state) => state.setSize);

  useEffect(() => {
    if (isMediumSizeOrGreater) {
      setSize("desktop");
    } else {
      setSize("smaller");
    }
  }, [isMediumSizeOrGreater, setSize]);

  return isMediumSizeOrGreater ? <DesktopOverlay /> : <SmallerDeviceOverlay />;
};

export default Overlay;
