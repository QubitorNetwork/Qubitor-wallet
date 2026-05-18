// Ambient declarations for Plasmo's asset-import URL schemes.
// Plasmo's bundler resolves these at build time; tsc needs the module shape.
declare module "data-base64:*" {
  const content: string;
  export default content;
}

declare module "data-text:*" {
  const content: string;
  export default content;
}

declare module "url:*" {
  const content: string;
  export default content;
}

declare module "raw:*" {
  const content: string;
  export default content;
}
