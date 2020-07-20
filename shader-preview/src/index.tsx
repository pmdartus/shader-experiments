import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import Preview from './Preview';

ReactDOM.render(
  <React.StrictMode>
    <Preview url={process.env.PUBLIC_URL + '/texture-ground-seamless.jpg'} />
  </React.StrictMode>,
  document.getElementById('root')
);
