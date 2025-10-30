import { render } from "preact";
import App from "./App";

const el = document.getElementById("root");
if (!el) throw new Error('Missing <div id="root"></div> in index.html');

render(<App />, el);
