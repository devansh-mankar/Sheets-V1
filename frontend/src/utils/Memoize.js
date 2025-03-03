const memoizedContent = {};

const memoize = (cellId, atomFactory) => {
  if (!memoizedContent[cellId]) {
    memoizedContent[cellId] = atomFactory();
  }
  return memoizedContent[cellId];
};
export { memoize };
