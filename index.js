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
// const clients = new Set();

router.post('/signup', async (ctx) => {
  if (
    Object.keys(ctx.request.body).length === 0 &&
    ctx.request.body.constructor === Object
  ) {
    ctx.response.body = {
      state: 'error',
      message: 'empty signup request',
    };
  }

  const { login } = JSON.parse(ctx.request.body);
  if (users.find((user) => user.name === login)) {
    ctx.response.body = {
      state: 'error',
      message: 'Этот псевдоним занят',
    };
  } else {
    const newUser = {
      id: idGenerator(),
      name: login,
      timeStamp: new Date(),
    };
    users.push(newUser);
    ctx.response.body = {
      state: 'ok',
      user: newUser,
    };
  }
});

app
  .use(cors())
  .use(koaBody({ urlencoded: true, multipart: true, json: true }))
  .use(router.routes());

wsServer.on('connection', (ws) => {
  const usersList = JSON.stringify(
    users.map((entry) => ({ ...entry, id: undefined }))
  );
  const userListMsg = JSON.stringify({
    type: 'userList',
    users: usersList,
  });
  [...wsServer.clients]
    .filter((client) => client.readyState === WebSocket.OPEN)
    .forEach((client) => {
      client.send(userListMsg);
    });

  ws.on('message', function (msg) {
    const { type, message, userId, time } = JSON.parse(msg);
    const user = users.find((entry) => entry.id === userId);
    user.timeStamp = time;

    if (type === 'logout') {
      console.log('logout initiated');

      const removeId = users.findIndex((entry) => entry.id === userId);
      users.splice(removeId, 1);

      const usersList = JSON.stringify(
        users.map((entry) => ({ ...entry, id: undefined }))
      );

      const userListMsg = JSON.stringify({
        type: 'userList',
        users: usersList,
      });

      [...wsServer.clients]
        .filter((client) => client.readyState === WebSocket.OPEN)
        .forEach((client) => {
          client.send(userListMsg);
        });
      return;
    }

    if (type === 'msg') {
      const responseMsg = JSON.stringify({
        type,
        name: `${user.name}`,
        message: `${message}`,
        time: formatDate(time),
      });
      [...wsServer.clients]
        .filter((client) => client.readyState === WebSocket.OPEN)
        .forEach((client) => client.send(responseMsg));
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
