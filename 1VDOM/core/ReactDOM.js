import React from "./React.js"

const ReactDOM = {
  createRoot(container) {
    return {
      render(root) {
        React.render(root, container)
      }
    }
  }
}

export default ReactDOM