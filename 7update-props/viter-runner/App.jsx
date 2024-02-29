import React from "./core/React.js";
let count = 10
let props = {
  id: "TEST_PROP",
}
function Counter() {
  const handle = () => {
    count++
    console.log("button clicked")
    props = {}
    React.update()
  }
  return <button {...props} onClick={handle}>click</button>
}
function App() {
  return (<article>
    emReact
    {count}
    <Counter></Counter>
  </article>
  )
}
console.log('App', App)


export default App