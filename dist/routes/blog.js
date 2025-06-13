// routes/blogs.js

const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { sessionProtect } = require('../middlewares/sessionAuth'); // or whatever your session middleware is called

// ========== EJS ROUTES ==========

// List all published blogs (Home)
router.get('/home', blogController.listPublishedBlogsEJS);

// Create blog form (GET)
router.get('/create', sessionProtect, (req, res) => {
    res.render('createBlog', { error: null, session: req.session });
});

// Handle blog creation (POST)
router.post('/create', sessionProtect, blogController.createBlogEJS);

// Single published blog view
router.get('/home/:id', blogController.showSingleBlogEJS);

// List draft blogs for logged-in user
router.get('/drafts', sessionProtect, blogController.listDraftsEJS);

// Edit blog form (GET)
router.get('/:id/edit', sessionProtect, blogController.showEditBlogEJS);

// Handle edit (POST)
router.post('/:id/edit', sessionProtect, blogController.editBlogEJS);

// Delete blog (POST)
router.post('/:id/delete', sessionProtect, blogController.deleteBlogEJS);

// Publish draft blog (POST)
router.post('/:id/publish', sessionProtect, blogController.publishDraftEJS);

// ========== API ROUTES ==========

// Public: Get all published blogs (JSON, paginated)
router.get('/', blogController.getPublishedBlogs);

// Public: Get single published blog (JSON)
router.get('/:id', blogController.getSingleBlog);

// Auth: Create blog (API)
router.post('/', sessionProtect, blogController.createBlog);

// Auth: Get current user's blogs (API)
router.get('/me/list', sessionProtect, blogController.getMyBlogs);

// Auth: Update blog (API)
router.patch('/:id', sessionProtect, blogController.updateBlog);

// Auth: Publish blog (API)
router.patch('/:id/publish', sessionProtect, blogController.publishBlog);

// Auth: Delete blog (API)
router.delete('/:id', sessionProtect, blogController.deleteBlog);

module.exports = router;
