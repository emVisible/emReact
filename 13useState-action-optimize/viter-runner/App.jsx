import React from "./core/React.js";


// 小问题: 直接设置0的话不会渲染——判定为false
function All() {
  const [v1, setV1] = React.useState("Foo")
  const [v2, setV2] = React.useState("Bar")
  const [v3, setV3] = React.useState(10)
  const [v4, setV4] = React.useState("Will Not Change")
  console.log("All Run")

  const handleAll = () => {
    setV1(v => v + " Foo")
    setV2("Banana")
    setV3(v => v + 1)
    setV4(v => "Will Not Change")
  }
  return (
    <div>
      <section>
        <h1>Foo</h1>
        {v1}
      </section>
      <section>
        <h1>Bar</h1>
        {v2}
      </section>
      <section>
        <h1>AllChange</h1>
        {v3}
      </section>
      <section>
        <h1>No render repetedly</h1>
        {v4}
      </section>
      <button onClick={handleAll}>Add</button>
    </div>
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