import { Bot } from 'grammy'

let bot: Bot | null = null

try {
  bot = new Bot(process.env['TELEGRAM_TOKEN']!)
} catch(e) {
  throw new Error('Please check if telegram environment variables are configured.')
}

export async function sendMsgToChannel(msg: string) {
  if(!bot) throw 'Your bot is not init.'
  try {
    await bot.api.sendMessage('@xiaoxiaopai', msg, {
      parse_mode: 'Markdown'
    })
    console.log(`Send message success: ${msg}`)
  } catch(e) {
    throw new Error(`Send message error: ${e}`) 
  }
}