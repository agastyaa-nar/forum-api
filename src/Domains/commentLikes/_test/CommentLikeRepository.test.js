const CommentLikeRepository = require('../CommentLikeRepository');

describe('CommentLikeRepository interface', () => {
  it('should throw error when invoke abstract behavior', async () => {
    const commentLikeRepository = new CommentLikeRepository();

    await expect(commentLikeRepository.isCommentLikedByUser('comment-123', 'user-123'))
      .rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.addLike('comment-123', 'user-123'))
      .rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.removeLike('comment-123', 'user-123'))
      .rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.getLikeCountByCommentId('comment-123'))
      .rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.getLikeCountsByCommentIds(['comment-123']))
      .rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});
