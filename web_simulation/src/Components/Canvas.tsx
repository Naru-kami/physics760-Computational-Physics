import { useEffect, useRef } from "react"
import { useStore } from "./Store";
import type { DataMessage } from "./Worker";

export default function Canvas() {
  const [_, setStore] = useStore(store => store.worker)
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    setStore(p => {
      if (!ref.current || p.worker) return p;

      const offscreen = ref.current.transferControlToOffscreen();

      p.worker = new Worker(new URL("./Worker.ts", import.meta.url), { type: "module" });
      p.worker.postMessage([{
        canvas: offscreen,
        width: p.N,
        height: p.N,
      }] satisfies DataMessage, [offscreen]);

      return { ...p }
    })

  }, []);

  return (
    <canvas
      ref={ref}
      width={512}
      height={512}
    />
  )
}
