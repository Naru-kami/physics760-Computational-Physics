import { useEffect, useRef } from "react"
import { useStore } from "./Store";

export default function Canvas() {
  const [data] = useStore(store => store.data)
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = ref.current?.getContext("2d");
    if (ctx) ctx.imageSmoothingEnabled = false;

    data.viewport = ref.current;
    data.initializeData();
    data.render();

    return () => { data.viewport = undefined }
  }, []);

  return (
    <canvas
      ref={ref}
      width={512}
      height={512}
    />
  )
}
