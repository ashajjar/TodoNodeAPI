require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { auth } = require('./middlewares/auth');

const port = process.env.PORT;

var app = express();

app.use(bodyParser.json());

app.post('/todos', auth, (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        _creator: res.user._id
    });

    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/todos', auth, (req, res) => {
    Todo.find({ _creator: res.user._id }).then((todos) => {
        res.send({ todos });
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/todos/:id', auth, (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send({ message: 'Invalid ID' });
    }
    Todo.findOne({ _id: id, _creator: res.user._id }).then((todo) => {
        if (!todo) {
            return res.status(404).send({ message: 'Todo object not found' });
        }
        res.send({ todo });
    }).catch((err) => {
        res.status(500).send({ message: 'Internal Error' });
    });
});

app.delete('/todos/:id', auth, (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send({
            message: 'Invalid ID'
        });
    }

    Todo.findOneAndRemove({ _id: id, _creator: res.user._id }).then((todo) => {
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

app.patch('/todos/:id', auth, (req, res) => {
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

    Todo.findOneAndUpdate({ _id: id, _creator: res.user._id }, { $set: body }, { new: true }).then((todo) => {
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

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    var user = new User(body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        return res.header('x-auth', token).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password)
        .then(token => res.header('x-auth', token).send({ token }))
        .catch((e) => {
            res.status(401).send({ message: 'Invalid email/password' });
        });
});

app.delete('/users/me/token', auth, (req, res) => {
    res.user.removeToken(res.token).then(() => {
        res.send();
    }).catch(() => {
        res.status(401).send();
    });
});

app.get('/users/me', auth, (req, res) => {
    res.send(res.user);
});

app.listen(port, () => {
    console.log('Started on port 3000');
});

module.exports = { app, mongoose };
