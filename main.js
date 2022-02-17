var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const fs = require('fs');
const csv = require('csv-parser');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
token: auth.token,
autorun: true
});
bot.on('ready', function (evt) {
logger.info('Connected');
logger.info('Logged in as: ');
logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
logger.info('Processing message from ' + user);

msgWords = message.split("\n")[0].split(" ");
if (msgWords[0] == 'Wordle' && parseInt(msgWords[1]) != NaN) {
    logger.info('Wordle score');
    var rounds = parseInt(msgWords[2].split('/')[0]);
    var gameNum = parseInt(msgWords[1]);
    addWordleGame(user, rounds, gameNum);
    //bot.sendMessage({
    //   to: channelID,
    //    message: user + ' took ' + rounds + ' guesses on Wordle ' + game + ', pretty dogwater'
    //});
}
if (msgWords[0] == 'Daily' && msgWords[1] == 'Quordle') {
    logger.info('Quordle score');
}
if (msgWords[0] == 'nerdlegame' && parseInt(msgWords[1]) != NaN) {
    logger.info('nerdlegame score');
}
if (msgWords[0] == '#Worldle') {
    logger.info('worldle score');
}
// Our bot needs to know if it will execute a command
// It will listen for messages that will start with `!`
if (message.substring(0, 1) == '!') {
    var args = message.substring(1).split(' ');
    var cmd = args[0];
    args = args.splice(1);
    switch(cmd) {
        // !ping
        case 'stats':
            var games = [];
            var avg = 0;
            var tot = 0;
            fs.createReadStream('gameData/wordleScores.csv')
                .pipe(csv())
                .on('data', (row) => {
                  games.push(row);
                })
                .on('end', () => {
                    logger.info('CSV file successfully processed');
                  games.forEach((game)=>{
                    if(game.Name == user){
                        tot += 1;
                        avg += parseInt(game.Rounds);
                    }
                });
                avg = avg/tot;
                bot.sendMessage({
                    to: channelID,
                    message: 'Your average Wordle score is: ' + avg + ', with ' + tot + ' recorded games.'
                });
            });
        case 'leaderboard':
            logger.info(args[1]);
        case 'help':
            bot.sendMessage({
                to: channelID,
                message: 'Available Commands:\n1) !stats - Displays your personal stats for each game.\n2) !leaderboard {wordle|nerdle|worldle|quordle} - Displays the top averages for the chosen game'
            });
        break;
        // Just add any case commands if you want to..
        }
    }
});
function addWordleGame(user, rounds, gameNum){
    var games = [];
    fs.createReadStream('gameData/wordleScores.csv')
        .pipe(csv())
        .on('data', (row) => {
          games.push(row);
        })
        .on('end', () => {
            var flag = true;
            games.forEach((game)=>{
                if(game.Name == user && game.Game == gameNum){
                    flag = false;
                }
            });
            if(flag){
                fs.appendFile('gameData/wordleScores.csv', user+','+gameNum+','+rounds+'\n', function (err) {
                    logger.info('Saved!');
                });
            }
            else{
                logger.info('Duplicate score; not saved');
            }
        });
}