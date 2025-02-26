import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const fastify = Fastify({
  logger: true
});
const prisma = new PrismaClient();


fastify.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

fastify.get('/todos', async (req, reply) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const skip = parseInt(req.query.skip) || 0;

    const [todos, total] = await Promise.all([prisma.todo.findMany({
      take: limit,
      skip: skip,
      orderBy: {
        id: 'desc'
      }
    }), prisma.todo.count()])

    return { todos, total, limit, skip };
  } catch (error) {
    reply.status(500).send({ error: "Something went wrong" });
  }
});

fastify.get('/todos/:id', async (req, reply) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid ID" });
    }

    const todo = await prisma.todo.findUnique({
      where: { id }
    });

    if (!todo) {
      return reply.status(404).send({ error: "Todo not found" });
    }

    return todo;
  } catch (error) {
    reply.status(500).send({ error: "Something went wrong" });
  }
});

fastify.post('/todos/add', async (req, reply) => {
  try {
    const { todo, completed } = req.body;

    if (!todo) {
      return reply.status(400).send({ error: "Todo is required" });
    }

    const newTodo = await prisma.todo.create({
      data: { todo, completed }
    });

    return reply.status(201).send(newTodo);
  } catch (error) {
    return reply.status(500).send({ error: "Something went wrong" });
  }
});

fastify.delete('/todos/:id', async (req, reply) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid ID" });
    }

    const deletedTodo = await prisma.todo.delete({
      where: { id }
    });

    return reply.send({ message: "Todo deleted successfully", deletedTodo });
  } catch (error) {
    return reply.status(500).send({ error: "Todo not found or could not be deleted" });
  }
});

fastify.put('/todos/:id', async (req, reply) => {
  try {
    const id = parseInt(req.params.id);
    const { title, completed } = req.body;

    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid ID" });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: { title, completed }
    });

    return reply.send(updatedTodo);
  } catch (error) {
    return reply.status(500).send({ error: "Todo not found or could not be updated" });
  }
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});