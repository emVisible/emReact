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
  // useEffect调用时机: render之后, 即commitWork完成后
  commitEffectHook()
  currentRoot = wipRoot
  wipRoot = null
  deletions = []
}


function commitEffectHook() {
  // 函数调用需要找到其函数组件——需要从根节点依次递归查找, 即commitWork的逻辑——链表
  function run(fiber) {
    if (!fiber) return
    // 如果为初始化调用, 则不需要检测
    // 利用alternate指针可以区分是否初始化
    if (!fiber.alternate) {
      fiber.effectHooks?.forEach(hook => hook.callback()) // 执行callback
    } else {
      fiber.effectHooks?.forEach((newHook, index) => {
        // 暂时没有考虑不传递depth的情况
        if (newHook.depth?.length > 0) {
          // 如果有依赖, 需要检查依赖是否改变, 改变了再执行回调
          const effectHook = fiber.alternate?.effectHooks[index]
          // 通过some进行检测, 如果depth中的值有任何变化, 即依赖变化, 则更新
          const shouldUpdate = effectHook?.depth?.some((oldDep, i) => {
            return oldDep !== newHook.depth[i]
          })
          shouldUpdate && newHook?.callback()
        }
      })
    }
    // 深度优先遍历
    run(fiber.child)
    run(fiber.sibling)
  }
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
  // 在调用函数组件中进行初始化
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
    queue: oldHook ? oldHook.queue : [] // 设置action队列, 当满足特定情况时清空队列
  }

  // 执行action队列
  stateHook.queue.forEach(action => { stateHook.state = action(stateHook.state) })
  stateHook.queue = [] // 清空queue

  stateIndex++
  stateHooks.push(stateHook)

  currentFiber.stateHooks = stateHooks

  function setState(action) {
    // 优化——对action设置的值进行判定: 如果当前传入的action的值和当前state的值相同, 则不处理
    const eagerState = typeof action === 'function' ? action(stateHook.state) : action
    if (eagerState === stateHook.state) return
    // 使useState支持原始值 -> 包装原始值为function
    // 入队
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
    depth
  }
  // 处理多个effect使用的情况
  effectHooks.push(effectHook)
  // 同处理useState的逻辑, 绑定到fiber上
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