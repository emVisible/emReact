import React from "./core/React.js";

//这里的问题是, 当在组件中点击某个子组件时, 所有子组件都会执行一次
// 核心的逻辑: 分离子DOM树, 中断后续sibling的执行

let v1 = 0
let v2 = 0
function Bar() {
  console.log("Bar Run")
  const update = React.update()
  const handleV2 = () => {
    console.log("v2 update")
    v2++
    update()
  }
  return (
    <div>
      <h1>bar</h1>
      {v2}
      <button onClick={handleV2}>Button</button>
    </div>
  )
}
function Foo() {
  console.log("Foo Run")
  const update = React.update()
  const handleV1 = () => {
    console.log("v1 update")
    v1++
    update()
  }

  return (
    <div>
      <h1>foo</h1>
      {v1}
      <button onClick={handleV1}>Button</button>
    </div>
  )
}

function App() {
  return (<div>
    emReact
    <Foo></Foo>
    <Bar></Bar>
  </div>
  )
}
export default App