
const menu =require('../menu.js');

module.exports= async function (ctx) {
return ctx.replyWithHTML('<b>Please choose an option from this menu</b>', { reply_markup: menu() });
}