type ClassName = string | string[] | Record<string, boolean>;

export default function classnames(
  ...classNames: readonly (ClassName | undefined)[]
): string {
  return classNames
    .filter((className): className is ClassName => className !== undefined)
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
