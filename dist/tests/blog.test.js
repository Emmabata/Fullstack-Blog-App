const request = require('supertest');
const app = require('../app'); // Adjust if your entry is named differently
const mongoose = require('mongoose');
const User = require('../models/userModels');
const Blog = require('../models/blogModel');

let token;

beforeAll(async () => {
  // Connect to a test database (set MONGODB_STR in .env.test)
  await mongoose.connect(process.env.MONGODB_STR);

  // Register and login a test user to get a JWT
  await User.deleteMany({});
  const resSignup = await request(app)
    .post('/signup')
    .send({ first_name: 'Test', last_name: 'User', email: 'test@example.com', password: 'password' });

  const resLogin = await request(app)
    .post('/login')
    .send({ email: 'test@example.com', password: 'password' });

  // Parse token from login (if you implement JWT response in login)
  token = resLogin.body.token; // adjust if you return token elsewhere
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Blog API', () => {
  it('should create a new blog as draft', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Blog 1', body: 'This is my first blog' });

    expect(res.statusCode).toBe(201);
    expect(res.body.state).toBe('draft');
  });

  it('should fetch published blogs', async () => {
    const res = await request(app)
      .get('/api/blogs')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // Add more tests for publish, update, delete, etc.
});
// describe('Blog EJS Rendering', () => {
//   it('should render the blogs page with published blogs', async () => {
//     const res = await request(app)
//       .get('/api/blogs/ejs')
//       .expect(200);

//     expect(res.text).toContain('<title>Blogs</title>'); // Adjust based on your EJS template
//   });

//   it('should render a single blog page', async () => {
//     const blog = await Blog.create({
//       title: 'Test Blog',
//       body: 'This is a test blog',