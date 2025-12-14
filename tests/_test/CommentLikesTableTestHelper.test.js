const pool = require('../../src/Infrastructures/database/postgres/pool');
const CommentLikesTableTestHelper = require('../CommentLikesTableTestHelper');
const UsersTableTestHelper = require('../UsersTableTestHelper');
const ThreadsTableTestHelper = require('../ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../CommentsTableTestHelper');

describe('CommentLikesTableTestHelper', () => {
  beforeAll(async () => {
    // Setup test data
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

  describe('addLike', () => {
    it('should add like with custom parameters', async () => {
      await CommentLikesTableTestHelper.addLike({
        id: 'like-custom',
        commentId: 'comment-123',
        owner: 'user-123',
        createdAt: '2024-01-01',
      });

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toEqual('like-custom');
    });

    it('should add like with default parameters', async () => {
      // Test default values for commentId and owner by calling with empty object
      await CommentLikesTableTestHelper.addLike({});

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toEqual('like-123'); // default id
    });
  });

  describe('findLikeByCommentIdAndOwner', () => {
    it('should find like by comment id and owner', async () => {
      await CommentLikesTableTestHelper.addLike({ id: 'like-find' });

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toEqual('like-find');
    });

    it('should return empty array when like not found', async () => {
      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-999', 'user-999');
      expect(likes).toHaveLength(0);
    });
  });

  describe('cleanTable', () => {
    it('should clean comment_likes table', async () => {
      await CommentLikesTableTestHelper.addLike({ id: 'like-clean' });
      await CommentLikesTableTestHelper.cleanTable();

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndOwner('comment-123', 'user-123');
      expect(likes).toHaveLength(0);
    });
  });
});
