export const TAG_UPDATE = Symbol('UPDATE');
export const TAG_PLACEMENT = Symbol('PLACEMENT');
export const TAG_DELETION = Symbol('DELETION');

export function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate && fiber.alternate.child;
  let prevSibling = null;

  const elements = children.flat();
  for (let n=0; (n < elements.length) || !!oldFiber; ++n) {
    const element = elements[n];
    let newFiber = null;

    const sameType =
      oldFiber && element &&
      element.type === oldFiber.type;

    // Here React also uses keys, that makes a better reconciliation. 
    // For example, it detects when children change places in the element array.

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: fiber,
        alternate: oldFiber,
        effectTag: TAG_UPDATE,
      };
    } else {
      if (element) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: fiber,
          alternate: null,
          effectTag: TAG_PLACEMENT,
        };
      }

      if (oldFiber) {
        oldFiber.effectTag = TAG_DELETION;
        deletions.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (!prevSibling) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
  }
}
