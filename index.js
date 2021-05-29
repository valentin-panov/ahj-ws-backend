const Koa = require('koa');

const cors = require('@koa/cors');
const koaBody = require('koa-body');

const Router = require('koa-router');

const http = require('http');

const WebSocket = require('ws');

const idGenerator = require('./idGenerator');
const formatDate = require('./formatDate');

const app = new Koa();
const router = new Router();
const server = http.createServer(app.callback());
const wsServer = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;
const users = [];

app.use(cors()).use(koaBody({ urlencoded: true, multipart: true, json: true }));

wsServer.on('connection', (ws) => {
  ws.on('message', function (msg) {
    const user = users.find((entry) => entry.connection === ws);

    const { type, message, userId, time, login } = JSON.parse(msg);
    if (type === 'login') {
      let responseMsg = {};

      if (users.find((user) => user.name === login)) {
        responseMsg = {
          error: 'error',
          name: 'ChatBot',
          message: 'Этот псевдоним занят',
          time: formatDate(new Date()),
        };
        ws.send(JSON.stringify(responseMsg));
      } else {
        // login success

        const newUser = {
          id: idGenerator(),
          name: login,
          connection: ws,
        };

        users.push(newUser);

        const usersList = JSON.stringify(
          users
            .filter((user) => user.name)
            .map((user) => ({
              ...user,
              id: undefined,
              connection: undefined,
            }))
        );

        responseMsg = {
          state: 'loginTrue',
          user: newUser,
          usersList,
        };

        ws.send(JSON.stringify(responseMsg));

        broadcast = JSON.stringify({
          type: 'msg',
          name: `ChatBot`,
          message: `${newUser.name} has entered`,
          time: formatDate(time),
          usersList,
        });
        [...wsServer.clients]
          .filter((client) => client.readyState === WebSocket.OPEN)
          .forEach((client) => client.send(broadcast));
      }
    }

    if (type === 'msg' && userId) {
      const responseMsg = JSON.stringify({
        type,
        name: `${user.name}`,
        message: `${message}`,
        time: formatDate(time),
      });
      [...wsServer.clients]
        .filter((client) => client.readyState === WebSocket.OPEN)
        .forEach((client) => client.send(responseMsg));
      return;
    }
  });

  ws.on('close', function () {
    try {
      const name = users.find((user) => user.connection === ws).name;
      const removeId = users.findIndex((user) => user.connection === ws);
      users.splice(removeId, 1);

      const usersList = JSON.stringify(
        users.map((user) => ({ ...user, id: undefined, connection: undefined }))
      );

      const userListMsg = JSON.stringify({
        type: 'msg',
        name: `ChatBot`,
        message: `${name} has left`,
        time: formatDate(new Date()),
        usersList,
      });

      [...wsServer.clients]
        .filter((client) => client.readyState === WebSocket.OPEN)
        .forEach((client) => {
          client.send(userListMsg);
        });
      return;
    } catch (e) {
      console.error(e.message);
    }
  });
});

async function start() {
  try {
    server.listen(port, () => console.log(`Server started on ${port}`));
  } catch (err) {
    console.error(err);
  }
}

start();
