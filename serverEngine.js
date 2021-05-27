const Koa = require('koa');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const Router = require('koa-router');
const generateId = require('./idGenerator');
const formatDate = require('./formatDate');

const serverEngine = new Koa();
const router = new Router();

serverEngine.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);
serverEngine.use(koaBody({ urlencoded: true, multipart: true, json: true }));

serverEngine.use(async (ctx) => {
  const { method, id } = ctx.request.query;
  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets;
      return;
    case 'createTicket':
      const newTicketData = ctx.request.body;
      const newTicket = {
        id: generateId(),
        name: newTicketData.name,
        status: false,
        description: newTicketData.description || '',
        created: formatDate(Date.now()),
      };
      tickets.push(newTicket);
      ctx.response.body = [newTicket];
      return;
    case 'deleteById':
      const deleteID = tickets.findIndex((ticket) => ticket.id === id);
      tickets.splice(deleteID, 1);
      ctx.response.body = tickets;
      return;
    case 'updateById':
      const updIndex = tickets.findIndex((ticket) => ticket.id === id);
      const updTicketData = ctx.request.body;
      const ticket = {
        ...tickets[updIndex],
        ...updTicketData,
      };
      tickets.splice(updIndex, 1, ticket);
      ctx.response.body = tickets;
      return;
    case 'ticketById':
      ctx.response.body = tickets.find((ticket) => ticket.id === id);
      return;
    default:
      ctx.response.status = 404;
      return;
  }
});

module.exports = serverEngine;
