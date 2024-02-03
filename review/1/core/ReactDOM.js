import React from "./React"


const ReactDOM = {
  createRoot(container){
    return {
      render(root){
        React.render(root, container)
      }
    }
  }
}

export default ReactDOM