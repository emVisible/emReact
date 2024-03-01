function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isTextNode = typeof child === 'string' || typeof child === 'number'
        return isTextNode ? createTextNode(child) : child
      }),
    },
  };
}

function createTextNode(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

let wipRoot = null
let currentRoot = null

let nextWorkOfUnit = null;

let deletions = []

let wipFiber = null

function render(el, container) {
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  };
  wipRoot = nextWorkOfUnit
}

function createDOM(type) {
  return type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function commitRoot() {
  deletions.forEach(commitDeletion)
  commitWork(wipRoot.child)
  commitEffectHook()
  currentRoot = wipRoot
  wipRoot = null
  deletions = []
}


function commitEffectHook() {
  function run(fiber) {
    if (!fiber) return
    if (!fiber.alternate) {
      fiber.effectHooks?.forEach(hook => {
        // 将callback返回的函数储存
        fiber.cleanup = hook.callback()
      })
    } else {
      fiber.effectHooks?.forEach((newHook, index) => {
        if (newHook.depth?.length > 0) {
          const effectHook = fiber.alternate?.effectHooks[index]
          const shouldUpdate = effectHook?.depth?.some((oldDep, i) => {
            return oldDep !== newHook.depth[i]
          })
          // 将callback返回的函数储存
          shouldUpdate && (newHook.cleanup = newHook?.callback())
        }
      })
    }
    run(fiber.child)
    run(fiber.sibling)
  }
  // cleanup函数, 用于在每次effect执行前执行
  function cleanUp(fiber) {
    if (!fiber) return
    // 重点: 执行的时oldFiber的cleanup, 所以要获取oldFiber hooks
    fiber.alternate?.effectHooks?.forEach(hook => {
      // 无依赖项不执行
      if (hook?.depth?.length > 0) {
        hook.cleanup && hook.cleanup()
      }
    })
    cleanUp(fiber.child)
    cleanUp(fiber.sibling)
  }
  cleanUp(wipRoot)
  run(wipRoot)
}

function commitDeletion(fiber) {
  if (fiber.dom) {
    let fiberParent = fiber.parent
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent
    }
    fiberParent.dom.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child)
  }
}


function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }

  if (fiber.effectTag === 'update') {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props)
  } else if (fiber.effectTag === 'placement') {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom)
    }
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop(deadline) {
  let isStop = false;
  while (!isStop && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);

    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      nextWorkOfUnit = undefined
    }

    isStop = deadline.timeRemaining() < 1;
  }
  if (!nextWorkOfUnit && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop);
}


function updateProps(dom, nextProps, prevProps) {
  Object.keys(prevProps).forEach(key => {
    if (key !== 'children') {
      if (!(key in nextProps)) {
        dom.removeAttribute(key)
      }
    }
  })
  Object.keys(nextProps).forEach(key => {
    if (key !== 'children') {
      if (key.startsWith('on')) {
        dom.addEventListener(key.slice(2).toLowerCase(), nextProps[key])
        dom.removeEventListener(key.slice(2).toLowerCase(), prevProps[key])
      } else {
        dom[key] = nextProps[key];
      }
    }
  })
}

function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child
  let prevChild = null;
  children.forEach((child, index) => {
    const isSame = oldFiber && oldFiber.type === child.type
    let newFiber;
    if (isSame) {
      newFiber = {
        effectTag: "update",
        alternate: oldFiber,
        dom: oldFiber.dom,
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
      };
    } else {
      if (child) {
        newFiber = {
          effectTag: "placement",
          dom: null,
          type: child.type,
          props: child.props,
          child: null,
          parent: fiber,
          sibling: null,
        };
      }
      if (oldFiber) {
        deletions.push(oldFiber)
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    if (newFiber) {
      prevChild = newFiber;
    }
  });
  while (oldFiber) {
    deletions.push(oldFiber)
    oldFiber = oldFiber.sibling
  }
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  stateHooks = []
  stateIndex = 0
  effectHooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type));
    updateProps(dom, fiber.props, {});
  }
  const children = fiber.props.children;
  reconcileChildren(fiber, children);
}

function performWorkOfUnit(fiber) {
  const isFunc = typeof fiber.type == 'function'
  if (isFunc) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) return fiber.child;
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return nextFiber;
}

function update() {
  let currentFiber = wipFiber
  return () => {
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot
  }
}

let stateHooks;
let stateIndex;
function useState(inital) {
  let currentFiber = wipFiber
  const oldHook = currentFiber.alternate?.stateHooks[stateIndex]
  const stateHook = {
    state: oldHook ? oldHook.state : inital,
    queue: oldHook ? oldHook.queue : []
  }

  stateHook.queue.forEach(action => { stateHook.state = action(stateHook.state) })
  stateHook.queue = []

  stateIndex++
  stateHooks.push(stateHook)

  currentFiber.stateHooks = stateHooks

  function setState(action) {
    const eagerState = typeof action === 'function' ? action(stateHook.state) : action
    if (eagerState === stateHook.state) return
    stateHook.queue.push(typeof action === 'function' ? action : () => action)

    wipRoot = {
      ...currentFiber,
      alternate: currentFiber
    };
    nextWorkOfUnit = wipRoot
  }

  return [
    stateHook.state,
    setState
  ]
}

let effectHooks
function useEffect(callback, depth) {
  const effectHook = {
    callback,
    depth,
    // 设置cleanup到收集对象effectHook中
    cleanup: undefined
  }
  effectHooks.push(effectHook)
  wipFiber.effectHooks = effectHooks
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
  update,
  useState,
  useEffect
};
export default React;