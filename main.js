var logger = require('winston');
const fs = require('fs');
const csv = require('csv-parser');
const { Client, Intents } = require('discord.js');
const { token } = require('./auth.json');
const axios = require('axios')

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {colorize: true});
logger.level = 'debug';

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

bot.once('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in');
});

bot.login(token);

bot.on("messageCreate", (message) => {
    if (message.author.bot) return false; 
    var user = message.author.username; 
    logger.info('Message from ' + user);
    msgWords = message.content.split("\n")[0].split(" ");
    if (msgWords[0] == 'Wordle' && !isNaN(parseInt(msgWords[1])) && !isNaN(parseInt(msgWords[2].split('/')[0]))) {
        logger.info('Wordle score');
        var rounds = parseInt(msgWords[2].split('/')[0]);
        var gameNum = parseInt(msgWords[1]);
        addWordleGame(user, rounds, gameNum, 'wordleScores');
    }
    else if (msgWords[0] == 'Daily' && msgWords[1] == 'Quordle' && !isNaN(parseInt(msgWords[2]))) {
        logger.info('Quordle score');
        var rounds = Math.max(...[message.content.split("\n")[1].substring(0,1),message.content.split("\n")[1].substring(3,4), message.content.split("\n")[2].substring(0,1),message.content.split("\n")[2].substring(3,4)]);
        var gameNum = parseInt(msgWords[2].split('#')[1]);
        logger.info(rounds);
        if(isNaN(rounds)){
            return false;
        }
        else{
            addWordleGame(user, rounds, gameNum, 'quordleScores');
        }
    }
    else if (msgWords[0] == 'nerdlegame' && !isNaN(parseInt(msgWords[1])) && !isNaN(parseInt(msgWords[2].split('/')[0]))) {
        logger.info('nerdlegame score');
        var rounds = parseInt(msgWords[2].split('/')[0]);
        var gameNum = parseInt(msgWords[1]);
        addWordleGame(user, rounds, gameNum, 'nerdleScores');
    }
    else if (msgWords[0] == '#Worldle' && !isNaN(parseInt(msgWords[1])) && !isNaN(parseInt(msgWords[2].split('/')[0]))) {
        logger.info('worldle score');
        var rounds = parseInt(msgWords[2].split('/')[0]);
        var gameNum = parseInt(msgWords[1]);
        addWordleGame(user, rounds, gameNum, 'worldleScores');
    }
});

bot.on('interactionCreate', async interaction => {
    logger.info('Processing message from ' + interaction.user.tag.split('#')[0]);
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'help') {
        await interaction.reply('Available Commands:\n1) /help - View this menu\n2) /stats - Displays your personal stats for each game.\n3) /leaderboard {wordle|nerdle|worldle|quordle} - Displays the top averages for the chosen game\n4) /catfact - Provide a random cat fact\n5) /faq - Provides answers to common FAQ\'s');
    } else if (commandName === 'stats') {
        user = interaction.options.getString("user") == null ? interaction.user.tag.split('#')[0] : interaction.options.getString("user");
        await getStats(user, interaction);
    } else if (commandName === 'leaderboard') {
        await getLeaderboard(interaction.options.getString("gametype"), interaction);
    } else if (commandName === 'catfact') {
        await getCatFact(interaction);
    } else if (commandName === 'faq') {
        await interaction.reply('Q: Why does a WordleBot have an option to get a random cat fact?\nA: Fuck you.');
    }

});
async function getCatFact(interaction){
    axios.get('https://catfact.ninja/fact')
    .then(res => {
        interaction.reply(res.data.fact);
    })
    .catch(error => {
        logger.info(error);
    })
}
async function getStats(user, interaction){
    var outString = "";
    getGameAvg(['wordle','worldle','quordle','nerdle'], outString, user, interaction)
}
function getGameAvg(type, outString, user, interaction){
    if(type.length == 0){
        interaction.reply(outString);
        return;
    }
    var games = [];
    var avg = 0;
    var tot = 0;
    var file = type[0] + 'Scores.csv';
    fs.createReadStream('gameData/' + file)
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

        if(!isNaN(avg) && tot != 0){
            outString += user + '\'s average ' + type[0] + ' score is: ' + avg + ', with ' + tot + ' recorded games.\n';
        }
        type.shift();
        getGameAvg(type, outString, user, interaction)
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

async function getLeaderboard(type, interaction){
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
            interaction.reply('Thats not a valid leaderboard you fuckin nonce');
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
        interaction.reply(outString);
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
