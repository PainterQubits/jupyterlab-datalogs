declare module "*.svg" {
  /** Contents of the SVG as a string. */
  const contents: string;
  export default contents;
}

declare module "*.svg?url" {
  /** URL (data URI) for the SVG. */
  const dataUri: string;
  export default dataUri;
}
