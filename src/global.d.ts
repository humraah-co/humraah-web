// Next only declares *.module.css. TypeScript 6 checks side-effect imports by default
// (noUncheckedSideEffectImports), so `import "./globals.css"` needs this.
declare module "*.css";
