const WebSocket = require('ws');
const wsServer = new WebSocket.Server({port: 8080});

wsServer.on('connection', onConnect);

function onConnect(wsClient) {
    console.log('Новый пользователь');
    wsClient.send('Привет');
  wsClient.on('message', function(message) {
    try {
        const jsonMessage = JSON.parse(message);
        switch (jsonMessage) {
          case 'ECHO':
            wsClient.send(jsonMessage.data);
            break;
          case: 'PING':
            setTimeout(function() {
              wsClient.send('PONG');
            }, 2000);
            break;
          default:
            console.log('Неизвестная команда');
            break;
        }
      } catch (error) {
        console.log('Ошибка', error);
      }
    })
  wsClient.on('close', function() {
      console.log('Пользователь отключился');
    })
  }

  console.log('Сервер запущен на 8080 порту');