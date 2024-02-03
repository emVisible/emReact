import React from "./core/React";
import ReactDOM from "./core/ReactDOM";

const App = React.createElement("div", { id: "app" }, "emReact")

ReactDOM.createRoot(document.getElementById("root")).render(App)