var env = process.env.NODE_ENV || 'development';

if (env === 'development') {
    process.env.PORT = 3000;
    process.env.MONGODB_URL = 'mongodb://localhost:27017/TodoApp';
    process.env.SECRET = 'dev_secret';
} else if (env === 'test') {
    process.env.PORT = 3000;
    process.env.MONGODB_URL = 'mongodb://localhost:27017/TodoAppTest';
    process.env.SECRET = 'test_secret';
}
