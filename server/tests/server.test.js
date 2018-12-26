const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');

const todos = [{
    _id: new ObjectID(),
    text: 'First test todo'
}, {
    _id: new ObjectID(),
    text: 'Second test todo'
}, {
    _id: new ObjectID(),
    text: 'Third test todo'
}, {
    _id: new ObjectID(),
    text: 'Forth test todo',
    completed: true,
    completedAt: 123456,
}];

beforeEach((done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
});

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find({ text }).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(4);
                    done();
                }).catch((e) => done(e));
            });
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(4);
            })
            .end(done);
    });
});

describe('GET /todos/:id', function () {
    it('should get a todo', (done) => {
        request(app)
            .get('/todos/' + todos[0]._id.toHexString())
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
            }).end(done);
    });

    it('should return 404 when a todo is not found', (done) => {
        request(app)
            .get('/todos/' + (new ObjectID()).toHexString())
            .expect(404)
            .expect((res) => {
                expect(res.body).toInclude({
                    message: 'Todo object not found'
                });
            }).end(done);
    });

    it('should return 400 when an invalid ID is given', (done) => {
        request(app)
            .get('/todos/invalidID')
            .expect(400)
            .expect((res) => {
                expect(res.body).toInclude({
                    message: 'Invalid ID'
                });
            }).end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo and get 404 when try to retrive it :)', (done) => {
        request(app)
            .delete('/todos/' + todos[2]._id.toHexString())
            .expect(200)
            .expect((res) => {
                expect(res.body.todo).toInclude({ text: todos[2].text });
            }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                request(app)
                    .delete('/todos/' + todos[2]._id.toHexString())
                    .expect(404)
                    .expect((res) => {
                        expect(res.body).toInclude({ message: 'Todo Not Found' });
                    })
                    .end(done);
            });

    });

    it('should return 400 if object id is invalid', (done) => {
        request(app)
            .delete('/todos/123456')
            .expect(400)
            .expect((res) => {
                expect(res.body).toInclude({ message: 'Invalid ID' });
            })
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should return 404 when a todo is not found', (done) => {
        request(app)
            .get('/todos/' + (new ObjectID()).toHexString())
            .expect(404)
            .expect((res) => {
                expect(res.body).toInclude({
                    message: 'Todo object not found'
                });
            }).end(done);
    });

    it('should return 400 if object id is invalid', (done) => {
        request(app)
            .patch('/todos/123456')
            .expect(400)
            .expect((res) => {
                expect(res.body).toInclude({ message: 'Invalid ID' });
            })
            .end(done);
    });

    it('should change text', (done) => {
        let text = 'This is a test of PATCH';
        request(app)
            .patch('/todos/' + todos[2]._id.toHexString())
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
            }).end(done);
    });

    it('should mark todo as incomplete, remove date and keep text as is', (done) => {
        request(app)
            .patch('/todos/' + todos[3]._id.toHexString())
            .send({ })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[3].text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toNotExist();
            }).end(done);
    });

    
    it('should mark todo completed, set date and keep text as is', (done) => {
        request(app)
            .patch('/todos/' + todos[1]._id.toHexString())
            .send({ completed : true })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[1].text);
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeA('number');
            }).end(done);
    });
});