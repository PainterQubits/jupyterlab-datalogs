declare module "*.svg" {
  /** Contents of the SVG as a string. */
  const contents: string;
  export default contents;
}

declare module "*?data-url" {
  /** Data URL for the file. */
  const dataUrl: string;
  export default dataUrl;
}
