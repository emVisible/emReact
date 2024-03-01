import React from "./core/React.js";


// 小问题: 直接设置0的话不会渲染——判定为false
function All() {
  const [v1, setV1] = React.useState("Foo")
  const [v2, setV2] = React.useState(10)
  console.log("All Run")

  const handleAll = () => {
    setV1(v => v + " Foo")
    setV2(v => v + 1)
  }
  return (
    <section>
      <div>
        <h1>Foo</h1>
        {v1}
      </div>
      <div>
        <h1>AllChange</h1>
        {v2}
      </div>
      <button onClick={handleAll}>Add</button>
    </section>
  )
}

function App() {
  return (<div>
    emReact
    <All></All>
  </div>
  )
}
export default App