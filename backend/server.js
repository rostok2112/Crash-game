const CHANCE_LESS_THAN_2 = 90;
const MAX_INT_MULTIPLY = 100;
const TIME_PER_ROUNDS = 5;
const TIME_AFTER_ROUND = 2;
const DELAY_PER_DELTA_MULT = 0.002;


const WebSocket = require('ws');
const wsServer = new WebSocket.Server({port: 8080});

wsServer.on('connection', onConnect);
function wsSendRoundPreparing(userClient){
  userClient.send(JSON.stringify({action: 'ROUND_PREPARING'}));
}
function wsSendRoundStarted(userClient, isBetted){
  userClient.send(JSON.stringify({action: 'ROUND_STARTED', isBetted: isBetted}));
}
function wsSendRoundEnds(userClient, totalMult){
  userClient.send(JSON.stringify({action: 'ROUND_ENDS', totalMult: totalMult}));
}

function wsSendRoundEnded(userClient){
  userClient.send(JSON.stringify({action: 'ROUND_ENDED'}));
}
function wsSendBetted(userClient){
  userClient.send(JSON.stringify({action: 'BETTED'}));
}
function wsSendCntBalance(userClient, cntBalance){
  userClient.send(JSON.stringify({action: 'CNT_BALANCE', balance: cntBalance.toString()}));
}

function wsSendWon(userClient, bet, mult){
  userClient.send(JSON.stringify({action: 'WON', bet: bet.toString(), mult: mult.toString()}));
}

function wsSendLost(userClient, bet){
  userClient.send(JSON.stringify({action: 'LOST', bet: bet}));
}
function onConnect(wsNewClient) {
    wsNewClient;
    console.log('Новый пользователь');
    wsNewClient.on('message', function(message) {
    try {
        const jsonMessage = JSON.parse(message);
        switch (jsonMessage.action) {
          case 'ECHO':
            wsNewClient.send(jsonMessage.data);
            break;
          case 'PING':
            setTimeout(function() {
              wsNewClient.send('PONG');
            }, 2000);

            case 'BTN_BET_CLICKED':
              if(!wsNewClient.isBetted && wsNewClient.isRoundPreparing){
                if(jsonMessage.bet > 0){
                  wsNewClient.cntBet = (parseFloat(jsonMessage.bet)  > wsNewClient.cntBalance) ? wsNewClient.cntBalance  :  jsonMessage.bet ;
                  wsNewClient.isBetted = true;
                  wsNewClient.cntBalance -= wsNewClient.cntBet;
                  wsSendCntBalance(wsNewClient, wsNewClient.cntBalance);
                  wsSendBetted(wsNewClient);
                }
                
              }
              else if(wsNewClient.isBetted && wsNewClient.isRoundStarted){
                if(!wsNewClient.isTook){
                  wsNewClient.cntBalance += wsNewClient.cntBet * wsNewClient.cntMult;
                  wsNewClient.isTook = true;
                 wsSendCntBalance(wsNewClient, wsNewClient.cntBalance);
                  wsSendWon(wsNewClient, wsNewClient.cntBet, wsNewClient.cntMult);
                }
              }
            break;
          default:
            console.log('Неизвестная команда');
            break;
        }
      } catch (error) {
        console.log('Ошибка', error);
      }
    })
    wsNewClient.on('close', function() {
      console.log('Пользователь отключился');
      
    })
    setTimeout(() => {

      wsNewClient.isRoundPreparing = false;
      wsNewClient.isRoundStarted = false;
      wsNewClient.isRoundEnds = false;
      wsNewClient.isRoundEnded = false;
      wsNewClient.isBetted = false; 
      wsNewClient.isTook = false;
      wsNewClient.cntBalance = 100;
      wsNewClient.cntBet = 0;
      wsNewClient.cntMult = 1;
      wsNewClient.totalMult = 1;
      mainLogic(wsNewClient);
    }, 4);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function printNumsWithDelay(userClient, typeofAction, preText, afterText, startNumber, finalNumber, delta, isSigned, delay) {
    for(let i =  startNumber;  (isSigned ? finalNumber : i ) > ( isSigned ? i : finalNumber); i -=  (isSigned ? -delta : delta) ) 
        await sleep(delay).then(() => {
                                        userClient.send(JSON.stringify({action: typeofAction, 
                                                                        data:  (preText + 
                                                                               (userClient.cntMult = (Math.trunc(i) == i ? Math.trunc(i) : 
                                                                               i.toFixed(3))) + afterText)
                                                                               .toString()}));                                                                  
       });
}


function mainLogic(userClient){
  let rndFloat = Math.random();
  let rndIsWithInt = Math.floor(Math.random() * 100);
  let rndInt = 0;
  
  if(rndIsWithInt > CHANCE_LESS_THAN_2)
      rndInt = Math.floor(Math.random() * MAX_INT_MULTIPLY);
  else rndInt = 0;
  
  userClient.totalMult = rndInt + rndFloat + 1;

  wsSendCntBalance(userClient, userClient.cntBalance);
  userClient.isRoundPreparing = true;
  userClient.isRoundStarted = false;
  userClient.isRoundEnded = false;
  wsSendRoundPreparing(userClient);

  userClient.isBetted = false;
  userClient.isTook = false;
  userClient.cntMult = 1;
  userClient.cntBet = 0;

    printNumsWithDelay(userClient, "SECOND_BEFORE_START","", "", TIME_PER_ROUNDS, 0, 1, 0,1000).then(function(){
      
      userClient.isRoundStarted = true;
      userClient.isRoundPreparing = false;
      wsSendRoundStarted(userClient, userClient.isBetted);

      if(!userClient.isBetted){
          //round started but user not betted
      }
      else{
          //round started, user not betted
      }

        printNumsWithDelay(userClient, "CNT_MULTIPLY", "x", "", 1.01, userClient.totalMult, DELAY_PER_DELTA_MULT, 1, 4).then(function(){
          
          if(userClient.isBetted && !userClient.isTook){
              //lost
              wsSendLost(userClient, userClient.cntBet);
              wsSendCntBalance(userClient, userClient.cntBalance);
          }
              
          if(userClient.isTook)
            ;//won
              
          //round end
          
          userClient.isRoundEnds = true;
          wsSendRoundEnds(userClient, userClient.totalMult);
          sleep(TIME_AFTER_ROUND * 1000).then(() => {
              //after round 
              userClient.isRoundEnds = false;
              userClient.isRoundEnded = true;
              wsSendRoundEnded(userClient);
                mainLogic(userClient);});   
      });
  });
}




  console.log('Сервер запущен на 8080 порту');

