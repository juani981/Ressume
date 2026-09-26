let uniqueIdCounter = 0;

export const generateUniqueId = (prefix = 'item') => {
  uniqueIdCounter += 1;
  return `${prefix}_${Date.now()}_${uniqueIdCounter}_${Math.random().toString(36).substr(2, 5)}`;
};
