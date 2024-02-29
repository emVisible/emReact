function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        // 处理function component传参
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

// work in process
let wipRoot = null
let currentRoot = null

let nextWorkOfUnit = null;

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
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

// 递归创建DOM
function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent
  // 处理函数 && 嵌套函数的情况: 向上查找拥有dom的节点, 作为父节点
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }

  if (fiber.effectTag === 'update') {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props) // 传递updateProps需要的diff判断条件
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
    isStop = deadline.timeRemaining() < 1;
  }
  if (!nextWorkOfUnit && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop);
}

/**
 * 对props更进做进一步处理: 除了初始化props, 还有props diff对比, 以更新props
 * 处理情况:
 *   oldFiber中有的属性, newFiber中没有 -> 删除
 *   oldFiber中有的属性, newFiber中也有 -> 更新(undefined)
 *   oldFiber中没有的属性, newFiber中有 -> 添加
 *   oldFiber中没有的属性, newFiber中也没有 (无需处理)
*/
function updateProps(dom, nextProps, prevProps) {
  // 对"有"的情况进行遍历
  Object.keys(prevProps).forEach(key => {
    if (key !== 'children') {
      // 对应删除的情况
      if (!(key in nextProps)) {
        dom.removeAttribute(key)
      }
    }
  })
  Object.keys(nextProps).forEach(key => {
    // 对应更新和添加
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
  // 根据alternate找到old节点
  let oldFiber = fiber.alternate?.child
  let prevChild = null;
  children.forEach((child, index) => {
    const isSame = oldFiber && oldFiber.type === child.type
    let newWork;
    if (isSame) {
      newWork = {
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
      newWork = {
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
      oldFiber = oldFiber.sibling
    }
    if (index === 0) {
      fiber.child = newWork;
    } else {
      prevChild.sibling = newWork;
    }
    prevChild = newWork;
  });
}

function updateFunctionComponent(fiber) {
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
  // function component 会将函数作为type传递进来
  const isFunc = typeof fiber.type == 'function'
  if (isFunc) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) return fiber.child;
  // 循环查找, 直到查找到最近的父级节点的sibling
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
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot
  };
  nextWorkOfUnit = wipRoot
}

requestIdleCallback(workLoop);

const React = {
  render,
  createElement,
  update
};
export default React;