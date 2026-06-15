import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ['.next/*', 'node_modules/*'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default config;
