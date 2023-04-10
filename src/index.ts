// Require the necessary discord.js classes
const {Client, Events, IntentsBitField, Partials } = require('discord.js');
// import {Client, Events, IntentsBitField, Partials } from 'discord.js';
import { getMemberFromUser, getMemberCurrentQuest } from "./user";
import { questResponse, startQuest } from "./quests/quest";

const dotenv = require('dotenv');
dotenv.config();
const token = process.env.DISCORD_TOKEN

// Create a new client instance
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.DirectMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMessageReactions,
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction,
		Partials.User
	],
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Start Direct message with bot
client.on(Events.MessageReactionAdd, async (reaction, user) => {
	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			reaction = await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}
	if (user.partial) {
		try {
			user = await user.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

	// Now the message has been cached and is fully available
	const guild = reaction.message.guild;
	const member = await getMemberFromUser(user, guild);
	const memberCurrentQuest = await getMemberCurrentQuest(member);

	const currentMessageContent = reaction.message.content;
	if (currentMessageContent && currentMessageContent.includes("Rejoins Archie dans son enquête en cliquant sur l'emoji 🔍 en dessous.")) {
		user.send(`Bienvenu dans mon agence ${user.username} !\nTa mission actuelle est: **${memberCurrentQuest.name}**`)
	}

	// start quest
	await startQuest(member, memberCurrentQuest);
});

client.on("messageCreate", async (message) => {
	if (message.author.bot) {
		return;
	}

	// Direct messages
	if(!message.guild) {
		const guild = await client.guilds.fetch(process.env.SUPERNOVA_GUILD);
		await questResponse(message, guild)
	}
	
	// Guild messages
	if (message.guild) {
		if (message.content.includes("Archie") || message.content.includes("archie") || message.content.includes("archi") || message.content.includes("Leguillon") || message.content.includes("leguillon")) {
			if (Math.round(Math.random())) {
				message.react('1090643485855596565')
			} else {
				message.reply("Service des huissiers d'état j'écoute.")
			}
			// console.log(message.guild.emojis.cache)
		}
	}
})

// Log in to Discord with your client's token
client.login(token);