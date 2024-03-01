import React from "./core/React.js";


function All() {
  const [v1, setV1] = React.useState(10)
  console.log("FC Run")

  const handleAll = () => {
    setV1(v => v + 1)
  }

  React.useEffect(()=>{
    console.log("[EFFECT] render")
    return ()=>{
      console.log("clean-up: render")
    }
  })

  React.useEffect(() => {
    console.log("[EFFECT] init")
    return ()=>{
      console.log("clean-up: init")
    }
  }, [])

  React.useEffect(() => {
    console.log("[Effect] update")
    return ()=>{
      console.log("clean-up: update")
    }
  }, [v1])

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