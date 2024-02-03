
let root = null
let nextWorkOfUnit = null

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        const isTextNode = typeof child === 'string' || typeof child === 'number'
        return isTextNode ? createTextNode(child) : child
      })
    }
  }
}

function createTextNode(value) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: value,
      children: []
    }
  }
}

function createDOM(type) {
  return type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type)
}

function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el]
    }
  }
  root = nextWorkOfUnit
}

function commitRoot() {
  commitWork(root.child)
  root = null
}

function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }
  if (fiber.dom) {
    fiberParent.dom.append(fiber.dom)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function initChildren(fiber, children) {
  let prevChild = null

  children.forEach((child, index) => {
    const newWork = {
      dom: null,
      type: child.type,
      props: child.props,

      child: null,
      parent: fiber,
      sibling: null
    }

    if (index === 0) fiber.child = newWork
    else {
      prevChild.sibling = newWork
    }
    prevChild = newWork
  })
}

function updateProps(dom, props) {
  Object.keys(props).forEach((prop) => {
    if (prop != 'children') {
      dom[prop] = props[prop]
    }
  })
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  initChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type))
    updateProps(dom, fiber.props)
  }

  const children = fiber.props.children
  initChildren(fiber, children)
}

function performWorkOfUnit(fiber) {
  // function component
  const isFunc = typeof fiber.type === 'function'
  if (isFunc) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // parent && sibling
  if (fiber.child) return fiber.child
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return nextFiber
}

function workLoop(deadline) {
  let isStop = false
  while (!isStop && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    isStop = deadline.timeRemaining() < 1
  }
  if (!nextWorkOfUnit && root) {
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)


const React = {
  render,
  createElement
}

export default React