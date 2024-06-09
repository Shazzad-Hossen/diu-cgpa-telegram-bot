require('dotenv').config();
const { Telegraf, Scenes, session  } = require('telegraf');
const { message } = require('telegraf/filters');
const wizard= require('./wizard');
const mainMenuReply = require('./handler/mainMenuReply');

(()=>{
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage(wizard);
bot.use(session());
bot.use(stage.middleware());
bot.start(async(ctx) => {
    mainMenuReply(ctx);
});
bot.action(/semres/, async (ctx) => {
    return await ctx.scene.enter('semesterWiseResultWizard');
  });
  bot.action(/allres/, async (ctx) => {
    return await ctx.scene.enter('allSemmResWizard');
  });

  

bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))


bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))  





})();