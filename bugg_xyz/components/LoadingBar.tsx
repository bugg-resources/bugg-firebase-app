import React, { useCallback, useContext, useMemo, useRef } from "react";
import LoadingTopBar, { LoadingBarRef } from "react-top-loading-bar";

const LoadingBarContext = React.createContext({
  start: () => {},
  complete: () => {},
} as {
  start: () => void;
  complete: () => void;
});

export default function LoadingBar(props: { children?: any }) {
  const barRef = useRef(null as any);
  const stackRef = useRef(0);

  let controls = useMemo(() => {
    return {
      start: () => {
        if (stackRef.current === 0) {
          barRef!.current!.continuousStart();
        }
        stackRef.current = stackRef.current + 1;
      },
      complete: () => {
        stackRef.current = stackRef.current - 1;
        if (stackRef.current === 0) {
          barRef!.current!.complete();
        }
      },
    };
  }, []);

  return (
    <LoadingBarContext.Provider value={controls}>
      <LoadingTopBar color="#f11946" ref={barRef} height={2} />
      {props.children}
    </LoadingBarContext.Provider>
  );
}

export function useLoadingBar() {
  return useContext(LoadingBarContext);
}
