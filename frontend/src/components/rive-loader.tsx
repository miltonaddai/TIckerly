import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Alignment, Fit, Layout, useRive } from "@rive-app/react-webgl2";
import { useUiStore } from "@/stores/ui";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

function Overlay() {
  const { RiveComponent } = useRive({
    src: "/tickerly.riv",
    artboard: "Loader",
    stateMachines: "State Machine 1",
    autoplay: true,
    layout: LAYOUT,
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-xl"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="size-28">
        <RiveComponent className="h-full w-full" />
      </div>
    </div>,
    document.body,
  );
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const active = useUiStore((state) => state.loadingCount > 0);
  return (
    <>
      {children}
      {active ? <Overlay /> : null}
    </>
  );
}

export function useLoadingOverlay(active: boolean) {
  const startLoading = useUiStore((state) => state.startLoading);
  const stopLoading = useUiStore((state) => state.stopLoading);

  useEffect(() => {
    if (!active) return;
    startLoading();
    return () => stopLoading();
  }, [active, startLoading, stopLoading]);
}
