const pool = require('../../database/postgres/pool');
const CommentLikeRepositoryPostgres = require('../CommentLikeRepositoryPostgres');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');

describe('CommentLikeRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'testuser' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  it('should add like correctly', async () => {
    const fakeIdGenerator = () => '123';
    const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

    await commentLikeRepositoryPostgres.addLike('comment-123', 'user-123');

    const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
    expect(likes).toHaveLength(1);
    expect(likes[0].id).toEqual('like-123');
  });

  it('should remove like correctly', async () => {
    await CommentLikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
    const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => 'xxx');

    await commentLikeRepositoryPostgres.removeLike('comment-123', 'user-123');

    const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
    expect(likes).toHaveLength(0);
  });

  it('should return true when liked and false when not', async () => {
    const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => 'xxx');
    await CommentLikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });

    const liked = await commentLikeRepositoryPostgres.isCommentLikedByUser('comment-123', 'user-123');
    const notLiked = await commentLikeRepositoryPostgres.isCommentLikedByUser('comment-123', 'user-456');

    expect(liked).toEqual(true);
    expect(notLiked).toEqual(false);
  });

  it('should get likeCount correctly', async () => {
    await UsersTableTestHelper.addUser({ id: 'user-1', username: 'user1' });
    await UsersTableTestHelper.addUser({ id: 'user-2', username: 'user2' });

    await CommentLikesTableTestHelper.addLike({ id: 'like-1', commentId: 'comment-123', owner: 'user-1' });
    await CommentLikesTableTestHelper.addLike({ id: 'like-2', commentId: 'comment-123', owner: 'user-2' });

    const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => 'xxx');

    const likeCount = await commentLikeRepositoryPostgres.getLikeCountByCommentId('comment-123');

    expect(likeCount).toEqual(2);

    // Cleanup only additional users (base data remains)
    await CommentLikesTableTestHelper.cleanTable();
    const users = await UsersTableTestHelper.findUsersById('user-1');
    if (users.length > 0) {
      await pool.query('DELETE FROM users WHERE id = $1 OR id = $2', ['user-1', 'user-2']);
    }
  });

  it('should get like counts by comment ids correctly', async () => {
    await UsersTableTestHelper.addUser({ id: 'user-1', username: 'user1' });
    await UsersTableTestHelper.addUser({ id: 'user-2', username: 'user2' });

    // Add another thread and comment for testing multiple comments
    await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-456', owner: 'user-123' });

    // Add likes for comment-123
    await CommentLikesTableTestHelper.addLike({ id: 'like-1', commentId: 'comment-123', owner: 'user-1' });
    await CommentLikesTableTestHelper.addLike({ id: 'like-2', commentId: 'comment-123', owner: 'user-2' });

    // Add likes for comment-456
    await CommentLikesTableTestHelper.addLike({ id: 'like-3', commentId: 'comment-456', owner: 'user-1' });

    const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => 'xxx');

    const likeCounts = await commentLikeRepositoryPostgres.getLikeCountsByCommentIds(['comment-123', 'comment-456']);

    expect(likeCounts).toEqual({
      'comment-123': 2,
      'comment-456': 1,
    });

    // Cleanup only additional data
    await CommentLikesTableTestHelper.cleanTable();
    await pool.query('DELETE FROM comments WHERE id = $1', ['comment-456']);
    await pool.query('DELETE FROM threads WHERE id = $1', ['thread-456']);
    await pool.query('DELETE FROM users WHERE id = $1 OR id = $2', ['user-1', 'user-2']);
  });

  it('should return empty object when getLikeCountsByCommentIds called with empty array', async () => {
    const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => 'xxx');

    const likeCounts = await commentLikeRepositoryPostgres.getLikeCountsByCommentIds([]);

    expect(likeCounts).toEqual({});
  });
});
