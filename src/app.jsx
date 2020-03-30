import xuul, { render, useState } from './xuul';

const Counter = props => {
  const [state, setState] = useState(1);
  return (
    <div style={{ color: state > 5 ? 'red' : 'black' }}>
      <h1 onClick={() => setState(state + 1)}>
        Count: {state}
      </h1>
    </div>
  )
};

const element = <Counter />;
const container = document.getElementById('root');
render(element, container);
