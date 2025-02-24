import { useCallback, useState } from "react";
import { LayoutChangeEvent, LayoutRectangle } from "react-native";

/**
 * Determines the size. Will return null until it gets the first on layout callback
 */
export default function useLayout(): [
  LayoutRectangle | null,
  (event: LayoutChangeEvent) => void
] {
  let [size, setSize] = useState(null as null | LayoutRectangle);
  let onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setSize(event.nativeEvent.layout);
    },
    [size, setSize]
  );
  return [size, onLayout];
}
