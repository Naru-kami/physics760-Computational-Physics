import createFastContext from "./FastContext";

export type StoreType = {
  isDark: boolean,
  T: number,
  N: 32 | 64 | 128 | 256 | 512,
  magnetization: { x: (number | null)[], y: (number | null)[], cumulative: (number | null)[], length: (number | null)[] },
  worker?: Worker,
}

const Store: StoreType = {
  isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  T: 1,
  N: 32,
  magnetization: {
    x: new Array(201).fill(null),
    y: new Array(201).fill(null),
    cumulative: new Array(201).fill(null),
    length: new Array(201).fill(null)
  },
}

const { Provider, useStore } = createFastContext(Store);

export { useStore };
export default Provider;