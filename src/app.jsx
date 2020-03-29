import Xuul from './xuul';

const Counter = props => {
  const [state, setState] = Xuul.useState(1);
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  )
};

const element = <Counter />;
const container = document.getElementById('root');
Xuul.render(element, container);
