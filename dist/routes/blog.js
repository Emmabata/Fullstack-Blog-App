const express = require('express');
const router = express.Router();
const Blog = require('../models/blogModel');
const { sessionProtect } = require('../middlewares/sessionAuth');



// Show create blog form (GET)
router.get('/create', sessionProtect, (req, res) => {
    res.render('createBlog', { error: null });
});

// Handle blog creation (POST)
router.post('/create', sessionProtect, async (req, res) => {
    const { title, description, tags, body } = req.body;
    try {
        await Blog.create({
            title,
            description,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            author: req.user._id,
            state: 'draft',
            body,
            reading_time: `${Math.ceil(body.split(/\s+/).length/200)} min read`
        });
        res.redirect('/blogs/drafts');
    } catch (err) {
        res.render('createBlog', { error: err.message });
    }
});


// List published blogs (everyone)
router.get('/home', async (req, res) => {
    const blogs = await Blog.find({ state: 'published' }).populate('author');
    res.render('blogs', { blogs });
});

// List my draft blogs (logged-in user)
router.get('/drafts', sessionProtect, async (req, res) => {
    const drafts = await Blog.find({ author: req.user._id, state: 'draft' }).populate('author');
    res.render('drafts', { drafts });
});

// Show edit blog form (GET)
router.get('/:id/edit', sessionProtect, async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog not found');
    if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
    res.render('editBlog', { blog, error: null });
});

// Handle blog edit (POST)
router.post('/:id/edit', sessionProtect, async (req, res) => {
    const { title, description, tags, body } = req.body;
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Blog not found');
        if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
        blog.title = title;
        blog.description = description;
        blog.tags = tags ? tags.split(',').map(t => t.trim()) : [];
        blog.body = body;
        blog.reading_time = `${Math.ceil(body.split(/\s+/).length/200)} min read`;
        await blog.save();
        res.redirect('/blogs/drafts');
    } catch (err) {
        res.render('editBlog', {
            blog: { _id: req.params.id, title, description, tags: tags.split(','), body },
            error: err.message
        });
    }
});


// Publish a draft blog (POST)
router.post('/:id/publish', sessionProtect, async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect('/blogs/drafts');
    if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
    blog.state = 'published';
    await blog.save();
    res.redirect('/blogs/home');
});

// EJS single published blog view
router.get('/home/:id', async (req, res) => {
    const blog = await Blog.findById(req.params.id).populate('author');
    if (!blog || blog.state !== 'published') return res.status(404).send('Blog not found');
    blog.read_count++;
    await blog.save();
    res.render('blog', { blog });
});

// Delete a blog (POST)
// Delete a blog (owner only, POST for EJS forms)
router.post('/:id/delete', sessionProtect, async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog not found');
    if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
    await blog.deleteOne();
    // Redirect depending on draft or published
    if (blog.state === 'draft') {
        res.redirect('/blogs/drafts');
    } else {
        res.redirect('/blogs/home');
    }
});

// ... (rest of your EJS and API routes)
module.exports = router;
