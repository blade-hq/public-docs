export function compareVersionStrings(a = '', b = '') {
  const parse = (value: string) => {
    const match = value.match(/^(\d{4})\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/);
    if (!match) return [0, 0, 0, -1];
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? Number.MAX_SAFE_INTEGER : Number(match[4])];
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

export function compareReleaseEntries(a: any, b: any) {
  const dateDiff = (b.data.date?.getTime() || 0) - (a.data.date?.getTime() || 0);
  return dateDiff || compareVersionStrings(b.data.version, a.data.version);
}
