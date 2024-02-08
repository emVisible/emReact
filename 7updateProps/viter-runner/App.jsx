import React from "./core/React.js";
// const App = React.createElement(
//   "div",
//   {
//     id: "app",
//   },
//   "emReact",
// );

let count = 10
function Counter() {
  const handleClick = () => {
    count++
    React.updateDOM()
  }
  return (
    <div>
      <div>Counter</div>
      <button onClick={handleClick}>{count}</button>
    </div>
  )
}

function App() {
  return (<div>
    emReact
    <Counter></Counter>
  </div>
  )
}
console.log('App', App)


export default App