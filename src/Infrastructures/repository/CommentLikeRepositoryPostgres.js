const CommentLikeRepository = require('../../Domains/commentLikes/CommentLikeRepository');

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async isCommentLikedByUser(commentId, owner) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);
    return result.rowCount > 0;
  }

  async addLike(commentId, owner) {
    const id = `like-${this._idGenerator()}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO comment_likes (id, owner, comment_id, created_at) VALUES ($1, $2, $3, $4)',
      values: [id, owner, commentId, createdAt],
    };

    await this._pool.query(query);
  }

  async removeLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async getLikeCountByCommentId(commentId) {
    const query = {
      text: 'SELECT COUNT(*) AS count FROM comment_likes WHERE comment_id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);
    return Number(result.rows[0].count);
  }

  async getLikeCountsByCommentIds(commentIds) {
    if (!commentIds.length) return {};

    const query = {
      text: `
        SELECT comment_id, COUNT(*) AS count
        FROM comment_likes
        WHERE comment_id = ANY($1::text[])
        GROUP BY comment_id
      `,
      values: [commentIds],
    };

    const result = await this._pool.query(query);
    const likeCounts = {};

    result.rows.forEach((row) => {
      likeCounts[row.comment_id] = Number(row.count);
    });

    return likeCounts;
  }
}

module.exports = CommentLikeRepositoryPostgres;
