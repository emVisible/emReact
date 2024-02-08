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
let root = null
let newDomRoot = null // 设置新DOM树变量
let nextWorkOfUnit = null;

function render(el, container) {
  root = {
    dom: container,
    props: {
      children: [el],
    },
  };
  nextWorkOfUnit = root
}

function createDOM(type) {
  return type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function commitRoot() {
  commitWork(root.child)
  newDomRoot = root
  root = null
}

function commitWork(fiber) {
  if (!fiber) return
  let fiberParent = fiber.parent
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent
  }

  if (fiber.effectType == 'update') {
    updateProps(fiber.dom, fiber.props, fiber?.alternate.props)
  } else if (fiber.effectType == 'placement') {
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
  if (!nextWorkOfUnit && root) {
    commitRoot()
  }
  requestIdleCallback(workLoop);
}

/**
 * 处理新旧关系
*/
function updateProps(dom, nextProps, prevProps) {
  /**
   * 1 需要删除 新: 无 / 旧: 有
   * 2 需要添加 新: 有 / 旧: 无
   * 3 需要更新 新: 有 / 旧: 有
  */
  Object.keys(prevProps).forEach(prop => {
    if (prop !== 'children') {
      if (!(prop in nextProps)) {
        dom.removeAttributes(prop)
      }
    }
  })

  Object.keys(nextProps).forEach(key => {
    if (key !== 'children') {
      if (nextProps[key] !== prevProps[key]) {
        if (key.startsWith("on")) {
          const eventName = key.slice(2).toLowerCase()
          dom.removeEventListener(eventName, prevProps[key])
          dom.addEventListener(eventName, nextProps[key])
        } else {
          dom[key] = nextProps[key]
        }
      }
    }
  })
}

function initChildren(fiber, children) {
  let prevChild = null;
  let oldFiber = fiber.alternate?.child
  children.forEach((child, index) => {
    // 根据type进行DOM比对, 更新
    const isSame = oldFiber && oldFiber.type == child.type
    let newFiber;
    if (isSame) {
      newFiber = {
        dom: oldFiber.dom,
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        effectType: 'update',
        alternate: oldFiber
      };
    } else {
      newFiber = {
        dom: null,
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        effectType: 'placement'
      };
    }
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  initChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type));
    updateProps(dom, fiber.props, {});
  }
  const children = fiber.props.children;
  initChildren(fiber, children);
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

/**
 * 获取新DOM树——更新DOM树为新DOM树
*/
function updateDOM() {
  root = {
    dom: newDomRoot.dom,
    props: newDomRoot.props,
    alternate: newDomRoot
  };
  nextWorkOfUnit = root
}

requestIdleCallback(workLoop);


const React = {
  render,
  createElement,
  updateDOM
};
export default React;
