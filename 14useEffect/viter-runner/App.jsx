import React from "./core/React.js";


function All() {
  const [v1, setV1] = React.useState("Foo")
  console.log("FC Run")

  const handleAll = () => {
    setV1(v => v + " Foo")
  }

  React.useEffect(()=>{
    console.log("[EFFECT] render")
  })

  React.useEffect(() => {
    console.log("[EFFECT] init")
  }, [])

  React.useEffect(() => {
    console.log("[Effect] update")
  }, [v1])

  // React.useEffect(()=>{
  //   console.log("[Effect] update-denpendency of foo")
  // }, [v1])
  return (
    <div>
      <section>
        <h1>Foo</h1>
        {v1}
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