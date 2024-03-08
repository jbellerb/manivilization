export default function classnames(
  ...classNames: readonly (string | string[] | Record<string, boolean>)[]
): string {
  return classNames
    .flatMap((className) => {
      if (typeof className === "string") {
        return className;
      } else if (Array.isArray(className)) {
        return className.join(" ");
      } else {
        return Object.entries(className)
          .filter(([_, v]) => v)
          .map(([k, _]) => k);
      }
    })
    .join(" ");
}
