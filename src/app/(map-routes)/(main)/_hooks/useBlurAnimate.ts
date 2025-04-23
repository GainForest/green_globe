import { TargetAndTransition } from "framer-motion";
import React from "react";

/**
 * This hook is used to set the animate prop to a value that doesn't have a blur filter... getting rid of any artifacts from other filters or backdrop filters.
 * @param defaultAnimate - The default animate prop value.
 * @param postAnimate - The animate prop value to set after the animation is complete.
 * @returns An object with the animate prop and the onAnimationComplete prop.
 */
const useBlurAnimate = (
  defaultAnimate: TargetAndTransition,
  postAnimate: TargetAndTransition
) => {
  const [animate, setAnimate] =
    React.useState<TargetAndTransition>(defaultAnimate);

  const handleAnimationComplete = (style: TargetAndTransition) => {
    if (style.filter === postAnimate.filter) return;
    if (style.filter === "blur(0px)") {
      setAnimate(postAnimate);
    } else {
      setAnimate(defaultAnimate);
    }
  };

  return {
    animate,
    onAnimationComplete: handleAnimationComplete,
  };
};

export default useBlurAnimate;
