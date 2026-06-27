const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '..', '..', 'OkkhorDB.users.json');
const blogsPath = path.join(__dirname, '..', '..', 'OkkhorDB.blogs.json');

const usersRaw = fs.readFileSync(usersPath, 'utf8');
const blogsRaw = fs.readFileSync(blogsPath, 'utf8');

const users = JSON.parse(usersRaw);
const blogs = JSON.parse(blogsRaw);

// Map of email to $oid
const emailToId = {};
for (const user of users) {
  if (user._id && user._id.$oid) {
    emailToId[user.email] = user._id; // keep it as { $oid: '...' }
  }
}

// Update blogs
for (const blog of blogs) {
  if (blog.ownerEmail && emailToId[blog.ownerEmail]) {
    blog.ownerId = emailToId[blog.ownerEmail];
  }
  
  delete blog.ownerEmail;
  delete blog.ownerName;
  delete blog.ownerImage;

  if (blog.blogTags && Array.isArray(blog.blogTags)) {
    blog.blogTags = blog.blogTags.map(tag => tag.text || tag.id || tag);
  }
  
  if (blog.upvotes === undefined) blog.upvotes = 0;
  if (blog.downvotes === undefined) blog.downvotes = 0;
}

// Ensure users don't need updates (they look fine, but we can write it back just in case)
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
fs.writeFileSync(blogsPath, JSON.stringify(blogs, null, 2));

console.log('Successfully updated JSON files.');
