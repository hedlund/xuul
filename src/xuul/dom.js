
export const TEXT_ELEMENT = 'TEXT_ELEMENT';

export function createDom(fiber) {
  const dom =
    fiber.type === TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && key !== 'style' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);
const isChanged = (prev, next) => key => !(key in next) || prev[key] !== next[key];
const getEventType = propName => propName.toLowerCase().substring(2);

export function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(isChanged(prevProps, nextProps))
    .forEach(name => {
      dom.removeEventListener(
        getEventType(name),
        prevProps[name],
      );
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = '';
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom.addEventListener(
        getEventType(name),
        nextProps[name],
      );
    });

  // Update the styles of the DOM element
  updateStyles(dom, prevProps.style, nextProps.style);
}

function updateStyles(dom, prevStyles = {}, nextStyles = {}) {
  // Remove old styles
  Object.keys(prevStyles)
    .filter(isGone(prevStyles, nextStyles))
    .forEach(name => {
      dom.style[name] = '';
    });

  // Set new or changes styles
  Object.keys(nextStyles)
    .filter(isNew(prevStyles, nextStyles))
    .forEach(name => {
      dom.style[name] = nextStyles[name];
    });
}
