const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./auth.json');
var logger = require('winston');
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {colorize: true});
logger.level = 'debug';

const commands = [
	new SlashCommandBuilder().setName('help').setDescription('Replies with a list of available WordleBot commands'),
	new SlashCommandBuilder().setName('stats').setDescription('Replies with various Wordle stats'),
	new SlashCommandBuilder().setName('leaderboard').setDescription('Replies with leaderboard for selected game')
        .addStringOption(option => option.setName('gametype').setDescription('Enter which game: {wordle|nerdle|worldle|quordle}'))
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => logger.info('Successfully registered application commands.'));