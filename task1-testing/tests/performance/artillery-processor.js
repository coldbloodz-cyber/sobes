module.exports = {
  generateRandomString,
  selectRandomItem
};

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

function selectRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}
