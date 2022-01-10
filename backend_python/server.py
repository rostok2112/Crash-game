import asyncio
import websockets
import json
import math
import random
import numpy 

cntr = 0

async def echo_hndlr(websocket, parsed):
    pass
                
async def msg_hndlr(websocket):
    msg_handlers = {
        'ECHO': echo_hndlr,
        'BTN_BET_CLICKED': btn_click_hndlr
    }
    async for message in websocket:
        print('got messsage', message)
        parsed = json.loads(message)
        if not parsed['action'] in msg_handlers:
            print(' Unknown type', parsed['action'])
        else:
            await msg_handlers[parsed['action']](websocket, parsed)


async def btn_click_hndlr(webSocket, parsed):
    bet = float(parsed['bet'])
    if not webSocket.isBetted and webSocket.isRoundPreparing:
        if bet > 0: #betted
            webSocket.cntBet = webSocket.cntBalance  if float(bet)  > webSocket.cntBalance   else  bet
            webSocket.isBetted = True
            webSocket.cntBalance -= webSocket.cntBet
            await wsSendCntBalance(webSocket, webSocket.cntBalance)
            await wsSendBetted(webSocket) 
             
    elif webSocket.isBetted and webSocket.isRoundStarted:
        if not webSocket.isTook: #lost
            webSocket.cntBalance += webSocket.cntBet * webSocket.cntMult
            webSocket.isTook = True
            await wsSendCntBalance(webSocket, webSocket.cntBalance)
            await wsSendWon(webSocket, webSocket.cntBet, webSocket.cntMult)

async def connection_handler(websocket):
    global cntr
    cntr += 1
    print('New connection', cntr)

    websocket.isRoundPreparing =  False
    websocket.isRoundStarted = False
    websocket.isRoundEnds = False
    websocket.isRoundEnded = False
    websocket.isBetted = False
    websocket.isTook = False
    websocket.cntBalance = 100
    websocket.cntBet = 0
    websocket.cntMult = 1
    websocket.totalMult = 1

    asyncio.ensure_future(main_logic(websocket))
    await msg_hndlr(websocket)

    print('connection end', cntr)   

async def send_nums_with_delay(userClient, typeofAction, preText, afterText, startNumber, finalNumber, delta, isSigned, millisec_delay,  funcToCopyField ): 
    if isSigned:
        delta = -delta
    for i in numpy.arange(startNumber, finalNumber, delta): 
        tmp = round(i, 3)
        if funcToCopyField:
            funcToCopyField(userClient, tmp)
            #userClient.cntMult = tmp
        await userClient.send( json.dumps( {'action': typeofAction, 'data': preText + str(tmp) + afterText}))
        await asyncio.sleep(millisec_delay/1000) #millisecond sleep   

def copyCntMult(userClient, cntMult):
    userClient.cntMult = cntMult
                                                         
async def wsSendCntBalance(userClient, cntBalance):
    await userClient.send( json.dumps( {'action': 'CNT_BALANCE', 'balance': cntBalance}))
async def wsSendRoundPreparing(userClient):
    await userClient.send( json.dumps( {'action': 'ROUND_PREPARING'}))
async def wsSendRoundStarted(userClient, isBetted):
    await userClient.send( json.dumps( {'action': 'ROUND_STARTED', 'isBetted': isBetted}))
async def wsSendLost(userClient, cntBet):
    await userClient.send( json.dumps( {'action': 'LOST', 'bet': cntBet}))
async def wsSendRoundEnds(userClient, totalMult):
    await userClient.send( json.dumps( {'action': 'ROUND_ENDS', 'totalMult': totalMult}))
async def wsSendRoundEnded(userClient):
    await userClient.send( json.dumps( {'action': 'ROUND_ENDED'}))
async def wsSendWon(userClient, cntBet, wonMult):
    await userClient.send( json.dumps( {'action': 'WON', 'bet': cntBet, 'mult': wonMult}))
async def wsSendBetted(userClient):
    await userClient.send( json.dumps( {'action': 'BETTED'}))


TIME_PER_ROUNDS = 5
TIME_AFTER_ROUND = 2
DELAY_PER_DELTA_MULT = 0.002

async def main_logic(userClient):

    while(True):
        
        userClient.totalMult = numpy.random.exponential(0.95) + 1

        await wsSendCntBalance(userClient, userClient.cntBalance)
        userClient.isRoundPreparing = True
        userClient.isRoundStarted = False
        userClient.isRoundEnded = False
        await wsSendRoundPreparing(userClient)

        userClient.isBetted = False
        userClient.isTook = False
        userClient.cntMult = 1
        userClient.cntBet = 0

        await send_nums_with_delay(userClient, "SECOND_BEFORE_START","", "", TIME_PER_ROUNDS, 0, 1, True, 1000, None)
        userClient.isRoundStarted = True
        userClient.isRoundPreparing = False
        await wsSendRoundStarted(userClient, userClient.isBetted)
        if not userClient.isBetted:   #round started but user not betted
            pass 
        else:   #round started, user  betted
            pass 
    
        await send_nums_with_delay(userClient, "CNT_MULTIPLY", "x", "", 1.01, userClient.totalMult, DELAY_PER_DELTA_MULT, False, 4, copyCntMult)
        if userClient.isBetted and not userClient.isTook:    #lost
            await wsSendLost(userClient, userClient.cntBet)
            await wsSendCntBalance(userClient, userClient.cntBalance)
          
        if userClient.isTook: #won;
            pass  
        #round end
        userClient.isRoundEnds = True
        await wsSendRoundEnds(userClient, userClient.totalMult)

        # time.sleep(TIME_AFTER_ROUND)
        await asyncio.sleep(TIME_AFTER_ROUND)

        #after round 
        userClient.isRoundEnds = False
        userClient.isRoundEnded = True
        await wsSendRoundEnded(userClient);  


async def main():
    async with websockets.serve(connection_handler, "localhost", 8381):
        print('serving')
        await asyncio.Future()  

asyncio.run(main())
