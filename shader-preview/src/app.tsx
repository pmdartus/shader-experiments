import React from 'react';
import {Provider, defaultTheme} from '@adobe/react-spectrum';

import Preview from './Preview';

export default function App() {
  return (
    <Provider theme={defaultTheme}>
      <Preview url={process.env.PUBLIC_URL + '/texture-ground-seamless.jpg'} />
    </Provider>
  );
}