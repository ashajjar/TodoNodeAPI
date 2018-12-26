const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const port = process.env.PORT || 3000;

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    var todo = new Todo({
        text: req.body.text
    });

    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({ todos });
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send({ message: 'Invalid ID' });
    }
    Todo.findById(id).then((todo) => {
        if (!todo) {
            return res.status(404).send({ message: 'Todo object not found' });
        }
        res.send({ todo });
    }).catch((err) => {
        res.status(500).send({ message: 'Internal Error' });
    });
});

app.delete('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send({
            message: 'Invalid ID'
        });
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if (!todo) {
            return res.status(404).send({
                message: 'Todo Not Found'
            });
        }
        return res.send({ todo });
    }).catch((e) => {
        return res.status(500).send({
            message: 'An error occurred while trying to delete a Todo'
        });
    });
});

app.patch('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send({ message: 'Invalid ID' });
    }
    let body = _.pick(req.body, ['text', 'completed']);

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completedAt = null;
        body.completed = false;
    }

    Todo.findByIdAndUpdate(id, { $set: body }, { new: true }).then((todo) => {
        if (!todo) {
            return res.status(404).send({
                message: 'Todo Not Found'
            });
        }
        res.send({ todo });
    }).catch((e) => {
        return res.status(500).send({
            message: 'An error occurred while trying to update a Todo'
        });
    });
});

app.listen(port, () => {
    console.log('Started on port 3000');
});

module.exports = { app };
