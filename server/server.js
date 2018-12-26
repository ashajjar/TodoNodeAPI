var express = require('express');
var bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

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
        res.send({todos});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/todos/:id', (req, res) => {
    let id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(400).send({message: 'Invalid ID'});
    }
    Todo.findById(id).then((todo) => {
        if (!todo) {
            return res.status(404).send({message: 'Todo object not found'});
        }
        res.send({todo});
    }).catch((err) => {
        res.status(500).send({message: 'Internal Error'});
    });
});

app.delete('/todos/:id',(req,res)=>{
    let id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(400).send({
            message:'Invalid ID'
        });
    }
    
    Todo.findByIdAndRemove(id).then((todo)=>{
        if(!todo){
            return res.status(404).send({
                message:'Todo Not Found'
            });
        }
        return res.send({todo});
    }).catch((e)=>{
        return res.status(500).send({
            message:'An error occurred while trying to delete a Todo'
        });
    });
});

app.listen(port, () => {
    console.log('Started on port 3000');
});

module.exports = {app};
