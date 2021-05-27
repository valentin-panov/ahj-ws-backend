const Koa = require('koa');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const Router = require('koa-router');
const websockify = require('koa-websocket');
const WebSocket = require('ws');
const http = require('http');

const generateId = require('./idGenerator');
const formatDate = require('./formatDate');

const chatEngine = new Koa();
const router = new Router();
const users = [];

chatEngine.use(cors());
chatEngine.use(koaBody({ urlencoded: true, multipart: true, json: true }));

router.post('/signup', async (ctx) => {
  if (
    Object.keys(ctx.request.body).length === 0 &&
    ctx.request.body.constructor === Object
  ) {
    ctx.response.body = 'empty signup request';
  }

  const { login } = JSON.parse(ctx.request.body);
  if (users.find((user) => user.name === login)) {
    ctx.response.body = {
      state: 'error',
      message: 'This login is occupied',
    };
  } else {
    const newUser = {
      id: generateId(),
      name: login,
    };
    users.push(newUser);
    ctx.response.body = {
      state: 'ok',
      user: newUser,
    };
  }
});

// // Создаём подключение к WS
// let wsServer = new WebSocket.Server({
//   port: 8081,
// });

// // Проверяем подключение
// wsServer.on('connection', function (ws) {
//   // Делаем подключение пользователя
//   let user = {
//     connection: ws,
//   };
//   // Добавляем нового пользователя ко всем остальным
//   users.add(user);
//   // Получаем сообщение от клиента
//   ws.on('message', function (message) {
//     // Перебираем всех подключенных клиентов
//     for (let user of users) {
//       // Отправляем им полученное сообщения
//       user.connection.send(message);
//     }
//   });
//   // Делаем действие при выходе пользователя из чата
//   ws.on('close', function () {
//     // Получаем ID этого пользователя
//     let id = users.indexOf(user);
//     // Убираем этого пользователя
//     users.splice(id, 1);
//   });
// });

module.exports = chatEngine;
