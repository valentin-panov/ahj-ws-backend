const Koa = require('koa');
const app = new Koa();

const cors = require('@koa/cors');
const koaBody = require('koa-body');

const Router = require('koa-router');
const router = new Router();

const http = require('http');
const server = http.createServer(app.callback());

const WebSocket = require('ws');
const wsServer = new WebSocket.Server({ server });

const idGenerator = require('./idGenerator');

const port = process.env.PORT || 3000;
const users = [];

app.use(cors());
app.use(koaBody({ urlencoded: true, multipart: true, json: true }));

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
    };
    users.push(newUser);
    ctx.response.body = {
      state: 'ok',
      user: newUser,
      users: users,
    };
  }
});

app.use(router.routes());
const connections = [];

wsServer.on('connection', function (ws, req) {
  let user = {
    connection: ws,
  };

  connections.push(user);

  ws.on('message', function (msg) {
    console.log(msg);
    const type = JSON.parse(msg).type;
    switch (type) {
      case 'send':
        for (let user of connections) {
          user.connection.send(msg);
        }
        break;
      case 'userList':
        for (let user of connections) {
          user.connection.send(
            JSON.stringify({ type: 'userList', users: this.users })
          );
        }
        break;
    }
  });

  ws.on('close', function () {
    let id = connections.indexOf(user);
    connections.splice(id, 1);
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
