const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app, mongoose } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');

const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
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
            .set('x-auth', users[0].tokens[0].token)
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
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', function () {
    it('should get a todo', (done) => {
        request(app)
            .get('/todos/' + todos[0]._id.toHexString())
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
            }).end(done);
    });

    it('should not get a todo created by another user', (done) => {
        request(app)
            .get('/todos/' + todos[3]._id.toHexString())
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 when a todo is not found', (done) => {
        request(app)
            .get('/todos/' + (new ObjectID()).toHexString())
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .expect((res) => {
                expect(res.body).toMatchObject({
                    message: 'Todo object not found'
                });
            }).end(done);
    });

    it('should return 400 when an invalid ID is given', (done) => {
        request(app)
            .get('/todos/invalidID')
            .set('x-auth', users[0].tokens[0].token)
            .expect(400)
            .expect((res) => {
                expect(res.body).toMatchObject({
                    message: 'Invalid ID'
                });
            }).end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo and get 404 when try to retrive it :)', (done) => {
        request(app)
            .delete('/todos/' + todos[2]._id.toHexString())
            .set('x-auth', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo).toMatchObject({ text: todos[2].text });
            }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                request(app)
                    .delete('/todos/' + todos[2]._id.toHexString())
                    .set('x-auth', users[1].tokens[0].token)
                    .expect(404)
                    .expect((res) => {
                        expect(res.body).toMatchObject({ message: 'Todo Not Found' });
                    })
                    .end(done);
            });
    });

    it('should not remove a todo created by others', (done) => {
        request(app)
            .delete('/todos/' + todos[0]._id.toHexString())
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                request(app)
                    .delete('/todos/' + todos[0]._id.toHexString())
                    .set('x-auth', users[0].tokens[0].token)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.todo.text).toBe(todos[0].text);
                    })
                    .end(done);
            });
    });

    it('should return 400 if object id is invalid', (done) => {
        request(app)
            .delete('/todos/123456')
            .set('x-auth', users[1].tokens[0].token)
            .expect(400)
            .expect((res) => {
                expect(res.body).toMatchObject({ message: 'Invalid ID' });
            })
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should return 404 when a todo is not found', (done) => {
        request(app)
            .patch('/todos/' + (new ObjectID()).toHexString())
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .expect((res) => {
                expect(res.body).toMatchObject({
                    message: 'Todo Not Found'
                });
            }).end(done);
    });

    it('should return 404 if the todo was not created by the authenticated user', (done) => {
        let text = 'This is a test of PATCH';
        request(app)
            .patch('/todos/' + todos[2]._id.toHexString())
            .set('x-auth', users[0].tokens[0].token)
            .send({ text })
            .expect(404)
            .end(done);
    });

    it('should return 400 if object id is invalid', (done) => {
        request(app)
            .patch('/todos/123456')
            .set('x-auth', users[1].tokens[0].token)
            .expect(400)
            .expect((res) => {
                expect(res.body).toMatchObject({ message: 'Invalid ID' });
            })
            .end(done);
    });

    it('should change text', (done) => {
        let text = 'This is a test of PATCH';
        request(app)
            .patch('/todos/' + todos[2]._id.toHexString())
            .set('x-auth', users[1].tokens[0].token)
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(text);
            }).end(done);
    });

    it('should mark todo as incomplete, remove date and keep text as is', (done) => {
        request(app)
            .patch('/todos/' + todos[3]._id.toHexString())
            .set('x-auth', users[1].tokens[0].token)
            .send({})
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[3].text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBeFalsy();
            }).end(done);
    });


    it('should mark todo completed, set date and keep text as is', (done) => {
        request(app)
            .patch('/todos/' + todos[1]._id.toHexString())
            .set('x-auth', users[0].tokens[0].token)
            .send({ completed: true })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[1].text);
                expect(res.body.todo.completed).toBe(true);
                expect(typeof res.body.todo.completedAt).toBe('number');
            }).end(done);
    });
});


describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toMatchObject({ message: 'unauthorised' });
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = '123mnb!';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBe(email);
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }

                User.findOne({ email }).then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password);
                    done();
                });
            });
    });

    it('should return validation errors if request invalid', (done) => {
        request(app)
            .post('/users')
            .send({
                email: 'and',
                password: '123'
            })
            .expect(400)
            .end(done);
    });

    it('should not create user if email in use', (done) => {
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: 'Password123!'
            })
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('should log user in and return auth token', function (done) {
        request(app)
            .post('/users/login')
            .send({
                email: users[0].email,
                password: users[0].password
            }).expect(200)
            .expect((response) => {
                expect(response.body.token).toBeTruthy();
                expect(response.headers['x-auth']).toBeTruthy();
                expect(response.headers['x-auth']).toBe(response.body.token);
            })
            .end(done);
    });

    it('should reject login for correct email and invalid password', function (done) {
        request(app)
            .post('/users/login')
            .send({
                email: users[0].email,
                password: 'random stuff'
            }).expect(401)
            .expect((response) => {
                expect(response.headers['x-auth']).toBeFalsy();
                expect(response.body.message).toBe('Invalid email/password');
            })
            .end(done);
    });

    it('should reject login for invalid credentials', function (done) {
        request(app)
            .post('/users/login')
            .send({
                email: 'random@email.com',
                password: 'random stuff'
            }).expect(401)
            .expect((response) => {
                expect(response.headers['x-auth']).toBeFalsy();
                expect(response.body.message).toBe('Invalid email/password');
            })
            .end(done);
    });
});
describe('DELETE /users/me/token', function () {

    it('should delete auth token if logged in', function (done) {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                User.findById(users[0]._id)
                    .then((user) => {
                        expect(user.tokens.length).toBe(0);
                        done();
                    })
                    .catch(done);
            });
    });

    it('should return unauthorised when not logged in', function (done) {
        request(app)
            .delete('/users/me/token')
            .expect(401)
            .end(done);
    });
});