// // jest.config.js
// import esm from 'esm';
// const esmRequire = esm(module);
// module.exports = {
//   moduleNameMapper: {
//     '^svelte$': require.resolve('svelte-jester'),
//   },
//   transform: {
//     '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
//     '^.+\\.svelte$': 'svelte-jester',
//   },
//   setupFilesAfterEnv: [
//     esmRequire.resolve('./app.test.js'),
//     '@testing-library/jest-dom/extend-expect',
//   ],
// };
