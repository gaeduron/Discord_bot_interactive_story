// Require the necessary discord.js classes
const { Client, Events, IntentsBitField, MessageReaction } = require('discord.js');

const dotenv = require('dotenv');
dotenv.config();
const token = process.env.DISCORD_TOKEN

// Create a new client instance
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	]
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("messageCreate", (message) => {
	if (message.author.bot) {
		return;
	}
	// message.react(":__:");
	if (message.content.includes("Archie") || message.content.includes("archie") || message.content.includes("archi") || message.content.includes("Leguillon") || message.content.includes("leguillon")) {
		if (Math.round(Math.random())) {
			message.react('1090643485855596565')
		} else {
			message.reply("Service des huissiers d'état j'écoute.")
		}
		// console.log(message.guild.emojis.cache)
	}
})

// Log in to Discord with your client's token
client.login(token);