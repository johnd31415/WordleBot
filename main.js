var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const fs = require('fs');
const csv = require('csv-parser');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {colorize: true});
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
    addWordleGame(user, rounds, gameNum, 'wordleScores');
}
if (msgWords[0] == 'Daily' && msgWords[1] == 'Quordle') {
    logger.info('Quordle score');
    var rounds = Math.max(...[message.split("\n")[1].substring(0,1),message.split("\n")[1].substring(3,4), message.split("\n")[2].substring(0,1),message.split("\n")[2].substring(3,4)]);
    var gameNum = parseInt(msgWords[2].split('#')[1]);
    addWordleGame(user, rounds, gameNum, 'quordleScores');
}
if (msgWords[0] == 'nerdlegame' && parseInt(msgWords[1]) != NaN) {
    logger.info('nerdlegame score');
    var rounds = parseInt(msgWords[2].split('/')[0]);
    var gameNum = parseInt(msgWords[1]);
    addWordleGame(user, rounds, gameNum, 'nerdleScores');
}
if (msgWords[0] == '#Worldle') {
    logger.info('worldle score');
    var rounds = parseInt(msgWords[2].split('/')[0]);
    var gameNum = parseInt(msgWords[1]);
    addWordleGame(user, rounds, gameNum, 'worldleScores');
}


if (message.substring(0, 1) == '!') {
    var args = message.substring(1).split(' ');
    var cmd = args[0];
    args = args.splice(1);
    switch(cmd) {
        // !ping
        case 'stats':
            getStats(user, channelID);
            break;
        case 'leaderboard':
            getLeaderboard(args[0], channelID);
            break;
        case 'help':
            bot.sendMessage({
                to: channelID,
                message: 'Available Commands:\n1) !help - View this menu\n2) !stats - Displays your personal stats for each game.\n3) !leaderboard {wordle|nerdle|worldle|quordle} - Displays the top averages for the chosen game'
            });
        break;
        // Just add any case commands if you want to..
        }
    }
});
function getStats(user, channelID){
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
        avg = Math.round(avg * 100) / 100
        bot.sendMessage({
            to: channelID,
            message: 'Your average Wordle score is: ' + avg + ', with ' + tot + ' recorded games.'
        });
    });
    fs.createReadStream('gameData/nerdleScores.csv')
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
        avg = Math.round(avg * 100) / 100
        bot.sendMessage({
            to: channelID,
            message: 'Your average Nerdle score is: ' + avg + ', with ' + tot + ' recorded games.'
        });
    });
    fs.createReadStream('gameData/worldleScores.csv')
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
        avg = Math.round(avg * 100) / 100
        bot.sendMessage({
            to: channelID,
            message: 'Your average Worldle score is: ' + avg + ', with ' + tot + ' recorded games.'
        });
    });
    fs.createReadStream('gameData/quordleScores.csv')
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
        avg = Math.round(avg * 100) / 100
        bot.sendMessage({
            to: channelID,
            message: 'Your average Quordle score is: ' + avg + ', with ' + tot + ' recorded games.'
        });
    });
}
function addWordleGame(user, rounds, gameNum, type){
    var games = [];
    fs.createReadStream('gameData/'+ type +'.csv')
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
                fs.appendFile('gameData/'+ type +'.csv', user+','+gameNum+','+rounds+'\n', function (err) {
                    logger.info('Saved!');
                });
            }
            else{
                logger.info('Duplicate score; not saved');
            }
        });
}
function getLeaderboard(type, channelID){
    logger.info('TODO');
    var fileName;
    switch(type) {
        case 'wordle':
            fileName = 'wordleScores';
            break;
        case 'quordle':
            fileName = 'quordleScores';
            break;
        case 'worldle':
            fileName = 'worldleScores';
            break;
        case 'nerdle':
            fileName = 'nerdleScores';
            break;
        default:
            bot.sendMessage({
                to: channelID,
                message: 'Thats not a valid leaderboard you fuckin nonce'
            });
            return;
    }
    var games = [];
    var leaders = [];
    fs.createReadStream('gameData/'+ fileName +'.csv')
        .pipe(csv())
        .on('data', (row) => {
          games.push(row);
        })
        .on('end', () => {
            logger.info('CSV file successfully processed');
          games.forEach((game)=>{
                var found = leaders.find(leader => leader.Name == game.Name);
                if(found){
                    found.tot += 1;
                    found.avg += parseInt(game.Rounds);
                }
                else{
                    leaders.push({
                        "Name": game.Name,
                        "tot": 1,
                        "avg": parseInt(game.Rounds)
                    });
                }
        });
        leaders.forEach((leader)=>{
            leader.avg = leader.avg/leader.tot;
            leader.avg = Math.round(leader.avg * 100) / 100;
        })
        var outString = 'Top average ' + type + ' scores:\n';
        leaders.sort(compare);
        leaders.forEach((leader)=>{
            outString += leader.Name + ': ' + leader.avg + '\n';
        })
        bot.sendMessage({
            to: channelID,
            message: outString
        });
    });
}
function compare(a,b){
    if(a.avg < b.avg){
        return -1;
    }
    if(a.avg > b.avg){
        return 1;
    }
    return 0;
}