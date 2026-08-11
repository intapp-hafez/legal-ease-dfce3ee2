export function createServerFn(options: any) {
  return {
    handler: (fn: any) => {
      return fn;
    }
  };
}
