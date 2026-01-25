import bcrypt from 'bcrypt';

export const seedData = async (db) => {
  // Check if data already exists
  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (row.count > 0) {
      console.log('ℹ️  Database already seeded');
      return;
    }

    console.log('🌱 Seeding database...');

    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const alicePass = await bcrypt.hash('alice123', 10);
    const bobPass = await bcrypt.hash('bob123', 10);
    const attackerPass = await bcrypt.hash('hack123', 10);

    // Insert users
    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password, bio, role) VALUES (?, ?, ?, ?, ?)'
    );

    insertUser.run('admin', 'admin@vulnerable.app', adminPass, 'System Administrator', 'admin');
    insertUser.run('alice', 'alice@example.com', alicePass, 'Software Developer 👩‍💻', 'user');
    insertUser.run('bob', 'bob@example.com', bobPass, 'Designer', 'user');
    insertUser.run('attacker', 'attacker@evil.com', attackerPass, 'Security Researcher', 'user');
    insertUser.finalize();

    // Insert posts
    const insertPost = db.prepare(
      'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)'
    );

    insertPost.run(2, 'Welcome to the Platform!', 'This is my first post. Excited to be here!');
    insertPost.run(2, 'Web Security Best Practices', 'Always sanitize user input and use prepared statements...');
    insertPost.run(3, 'New Design Trends 2026', 'Check out these amazing UI patterns...');
    insertPost.run(2, 'My Favorite JavaScript Libraries', 'Here are some libraries I use daily...');
    insertPost.run(3, 'Typography in Web Design', 'Good typography makes a huge difference...');
    insertPost.run(2, 'Working Remotely Tips', 'How I stay productive while working from home...');
    insertPost.run(4, 'Check this out!', 'Interesting link: <a href="/api/redirect?url=http://evil.com">Click here</a>');
    insertPost.run(2, 'Database Optimization', 'Tips for making your queries faster...');
    insertPost.run(3, 'Color Theory Basics', 'Understanding color combinations...');
    insertPost.run(2, 'Testing Strategies', 'How I approach testing my applications...');
    insertPost.finalize();

    // Insert comments (some with XSS payloads)
    const insertComment = db.prepare(
      'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)'
    );

    insertComment.run(1, 3, 'Great post! Welcome aboard!');
    insertComment.run(1, 4, 'Nice to meet you!');
    insertComment.run(2, 3, 'Very informative, thanks for sharing!');
    insertComment.run(2, 4, '<img src=x onerror=alert("XSS")>');
    insertComment.run(3, 2, 'Love these trends!');
    insertComment.run(4, 3, 'I use React and Vue mostly');
    insertComment.run(5, 2, 'Typography is underrated!');
    insertComment.run(6, 3, 'Great tips!');
    insertComment.run(1, 2, 'Thanks everyone!');
    insertComment.run(3, 4, '<script>console.log("Stored XSS")</script>');
    insertComment.finalize();

    // Insert messages
    const insertMessage = db.prepare(
      'INSERT INTO messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)'
    );

    insertMessage.run(2, 3, 'Hey Bob, loved your design post!');
    insertMessage.run(3, 2, 'Thanks Alice! Glad you enjoyed it.');
    insertMessage.run(2, 3, 'Want to collaborate on a project?');
    insertMessage.run(3, 2, 'Sure! What do you have in mind?');
    insertMessage.run(1, 2, 'Welcome to the platform Alice!');
    insertMessage.finalize();

    console.log('✅ Database seeded successfully');
  });
};
