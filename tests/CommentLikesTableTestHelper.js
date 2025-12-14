const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentLikesTableTestHelper = {
  async addLike({
    id = 'like-123',
    commentId = 'comment-123',
    owner = 'user-123',
    createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: 'INSERT INTO comment_likes VALUES ($1, $2, $3, $4)',
      values: [id, owner, commentId, createdAt],
    };

    await pool.query(query);
  },

  async findLikeByCommentIdAndOwner(commentId, owner) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comment_likes');
  },
};

module.exports = CommentLikesTableTestHelper;
