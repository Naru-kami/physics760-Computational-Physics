import 'katex/dist/katex.min.css';
import Controls from "./Components/Controls";
import Canvas from "./Components/Canvas";
import Provider from "./Components/Store";
import Plots from './Components/Plots';

export default function App() {
  return (
    <Provider>
      <div className="app">
        <div>
          <Controls />
          <Canvas />
        </div>
        <div>
          <Plots />
        </div>
      </div>
    </Provider>
  )
}
