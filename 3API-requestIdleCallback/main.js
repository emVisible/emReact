let id = 1
function taskDispatch(deadline) {
  id++
  let isStop = false
  while (!isStop) {
    console.log(`task${id} run`)
    isStop = deadline.timeRemaining() < 1
  }
  requestIdleCallback(taskDispatch)
}

requestIdleCallback(taskDispatch)
