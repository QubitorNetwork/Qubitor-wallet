import { useState, useCallback } from "react";

/**
 * Lets a screen cycle through its States/Warnings/Edge cases for design review.
 * Source: docs/swallet-ui-adaptation.md per-screen "States" lists.
 */
export function useMockState<T extends string>(variants: readonly T[], initial?: T) {
  const [index, setIndex] = useState(() => {
    if (!initial) return 0;
    const i = variants.indexOf(initial);
    return i >= 0 ? i : 0;
  });

  const cycle = useCallback(() => {
    setIndex((i) => (i + 1) % variants.length);
  }, [variants.length]);

  const set = useCallback(
    (variant: T) => {
      const i = variants.indexOf(variant);
      if (i >= 0) setIndex(i);
    },
    [variants],
  );

  return { variant: variants[index]!, variants, cycle, set };
}
