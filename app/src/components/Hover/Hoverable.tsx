import React, { ReactElement } from "react";
import { isHoverEnabled } from "./HoverState";

interface HoverableProps {
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  children?: (hovered: boolean) => any | ReactElement;
}

export default function Hoverable(props: HoverableProps) {
  const { onHoverIn, onHoverOut, children } = props;

  const [isHovered, setHovered] = React.useState(false);
  const [showHover, setShowHover] = React.useState(true);

  function handleMouseEnter(e: any) {
    if (isHoverEnabled() && !isHovered) {
      if (onHoverIn) onHoverIn();
      setHovered(true);
    }
  }

  function handleMouseLeave(e: any) {
    if (isHovered) {
      if (onHoverOut) onHoverOut();
      setHovered(false);
    }
  }

  function handleGrant() {
    setShowHover(false);
  }

  function handleRelease() {}

  const child =
    typeof children === "function"
      ? children(showHover && isHovered)
      : children;

  return React.cloneElement(React.Children.only(child), {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    // prevent hover showing while responder
    onResponderGrant: () => setShowHover(false),
    onResponderRelease: () => setShowHover(true),
    // if child is Touchable
    onPressIn: handleGrant,
    onPressOut: handleRelease,
  });
}
