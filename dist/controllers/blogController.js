const Blog = require('../models/blogModel');
const User = require('../models/userModel'); // Or userModels, match your file

function calculateReadingTime(text) {
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
}

// ===== EJS Controllers =====

// Show edit form (GET)
exports.showEditBlogEJS = async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect('/blogs/home');
    // Ownership check
    if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
    res.render('editBlog', { blog, error: null });
};

// Handle edit (POST)
exports.editBlogEJS = async (req, res) => {
    const { title, description, tags, body } = req.body;
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.render('editBlog', { blog: {}, error: "Blog not found." });
        if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
        blog.title = title;
        blog.description = description;
        blog.tags = tags ? tags.split(',').map(t => t.trim()) : [];
        blog.body = body;
        blog.reading_time = calculateReadingTime(body);
        await blog.save();
        res.redirect('/blogs/home');
    } catch (err) {
        res.render('editBlog', {
            blog: { _id: req.params.id, title, description, tags: tags.split(','), body },
            error: err.message
        });
    }
};

// Handle delete (POST)
exports.deleteBlogEJS = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.redirect('/blogs/home');
        if (!blog.author.equals(req.user._id)) return res.status(403).send('Forbidden');
        await blog.deleteOne();
        res.redirect('/blogs/home');
    } catch (err) {
        res.status(500).send("Delete failed.");
    }
};

// For EJS form POST /blogs/create
exports.createBlogEJS = async (req, res) => {
    const { title, description, tags, body } = req.body;
    try {
        await Blog.create({
            title,
            description,
            tags: tags ? tags.split(',').map(t=>t.trim()) : [],
            author: req.user._id,
            state: 'draft',
            body,
            reading_time: calculateReadingTime(body),
        });
        res.redirect('/blogs/home');
    } catch (err) {
        res.render('createBlog', { error: err.message });
    }
};

// ===== API Controllers =====

// CREATE Blog (API, JSON)
exports.createBlog = async (req, res) => {
    const { title, description, tags, body } = req.body;
    try {
        const blog = await Blog.create({
            title,
            description,
            tags: tags ? tags.split(',').map(t=>t.trim()) : [],
            author: req.user._id,
            state: 'draft',
            body,
            reading_time: calculateReadingTime(body),
        });
        res.status(201).json(blog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET published blogs (anyone, paginated/search/filter/order)
exports.getPublishedBlogs = async (req, res) => {
    let { page = 1, limit = 20, author, title, tags, sort } = req.query;
    let query = { state: 'published' };
    if (author) query.author = author;
    if (title) query.title = new RegExp(title, 'i');
    if (tags) query.tags = { $in: tags.split(',').map(t=>t.trim()) };

    let sortOptions = {};
    if (sort) {
        const allowed = ['read_count','reading_time','timestamp'];
        sort.split(',').forEach(field => {
            const dir = field.startsWith('-') ? -1 : 1;
            const clean = field.replace(/^-/, '');
            if (allowed.includes(clean)) sortOptions[clean] = dir;
        });
    } else {
        sortOptions.timestamp = -1;
    }

    try {
        const blogs = await Blog.find(query)
            .populate('author', 'first_name last_name email')
            .sort(sortOptions)
            .skip((page-1)*limit)
            .limit(Number(limit));
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET single published blog (increments read_count)
exports.getSingleBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'first_name last_name email');
        if (!blog || blog.state !== 'published')
            return res.status(404).json({ error: 'Blog not found or not published' });

        blog.read_count++;
        await blog.save();
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET current user's blogs (must be logged in, paginated/filter by state)
exports.getMyBlogs = async (req, res) => {
    let { page = 1, limit = 20, state } = req.query;
    let query = { author: req.user._id };
    if (state) query.state = state;
    try {
        const blogs = await Blog.find(query)
            .sort({ timestamp: -1 })
            .skip((page-1)*limit)
            .limit(Number(limit));
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE a blog (API, owner only)
exports.updateBlog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        if (blog.author.toString() !== req.user._id.toString())
            return res.status(403).json({ error: 'Not authorized' });

        Object.assign(blog, req.body);
        if (req.body.body) blog.reading_time = calculateReadingTime(req.body.body);
        await blog.save();
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUBLISH a blog (API, owner only)
exports.publishBlog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        if (blog.author.toString() !== req.user._id.toString())
            return res.status(403).json({ error: 'Not authorized' });

        blog.state = 'published';
        await blog.save();
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE a blog (API, owner only)
exports.deleteBlog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        if (blog.author.toString() !== req.user._id.toString())
            return res.status(403).json({ error: 'Not authorized' });

        await blog.remove();
        res.json({ message: 'Blog deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
