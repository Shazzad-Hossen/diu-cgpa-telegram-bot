const { Markup } =require("telegraf");
const  defaultMenu  =require("./buttons/buttons.js");

module.exports= function (type='main') {

  const menu = [...defaultMenu];

  const fallBack = {
    inline_keyboard: [[Markup.button.callback('↰ Main Menu', 'clear')]]
  };

  if (!type) {
    const primary = menu.find(menuItem => menuItem.primary);
    if (primary) {
      const commandToSend = chunkArray(primary.primary, primary.row);
      return { inline_keyboard: commandToSend.map(row => row.map(([name, action]) => Markup.button.callback(name, action))) };
    }
  }

  const matched = menu.find(menuItem => menuItem[type]);
  if (!matched) return fallBack;

  const commandToSend = chunkArray(matched[type], matched.row);
  return { inline_keyboard: commandToSend.map(row => row.map(([name, action]) => Markup.button.callback(name, action))) };
}

function chunkArray(arr, size) {
  const chunkedArray = [];
  for (let i = 0; i < arr.length; i += size) {
    chunkedArray.push(arr.slice(i, i + size));
  }
  return chunkedArray;
}