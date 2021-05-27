function generateId() {
  return `${Date.now()}-${Math.random()}`;
}

module.exports = generateId;
