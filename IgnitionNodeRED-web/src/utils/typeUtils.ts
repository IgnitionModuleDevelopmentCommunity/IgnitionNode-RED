export namespace TypeUtils {
  export const emptyString = (value) => {
    return value === undefined || value === null || value === "";
  };

  export const isUndefined = (value) => {
    return value === undefined;
  };
}
