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
  currentRoot = wipRoot
  wipRoot = null
  deletions = []
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
      if (oldFiber) {
        deletions.push(oldFiber)
      }
    }

    // 核心指针关系, oldFiber指向多余的旧节点
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
  // 如果oldFiber最后遍历依旧存在, 则为多余, 直接删除; 根据sibling循环删除多个多余节点——即删除oldFiber.parent的所有child
  while (oldFiber) {
    deletions.push(oldFiber)
    oldFiber = oldFiber.sibling
  }
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