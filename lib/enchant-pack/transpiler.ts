export function ransformFile(code) {
  const transformResult = { code: '' };
  try {
    transformResult.code = transformSync(code, {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code;
  } catch (error) {
    transformResult.errorMessage = error.message;
  }
  return transformResult;
}
