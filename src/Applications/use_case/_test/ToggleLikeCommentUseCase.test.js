const ToggleLikeCommentUseCase = require('../ToggleLikeCommentUseCase');
const CommentLikeRepository = require('../../../Domains/commentLikes/CommentLikeRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');

describe('ToggleLikeCommentUseCase', () => {
  it('should add like when user has not liked the comment yet', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();

    mockCommentRepository.verifyCommentExist = jest.fn()
      .mockResolvedValue();
    mockCommentLikeRepository.isCommentLikedByUser = jest.fn()
      .mockResolvedValue(false);
    mockCommentLikeRepository.addLike = jest.fn()
      .mockResolvedValue();
    mockCommentLikeRepository.removeLike = jest.fn()
      .mockResolvedValue();

    const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
    });

    // Act
    await toggleLikeCommentUseCase.execute(useCasePayload);

    // Assert
    expect(mockCommentRepository.verifyCommentExist)
      .toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentLikeRepository.isCommentLikedByUser)
      .toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentLikeRepository.addLike)
      .toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentLikeRepository.removeLike)
      .not.toBeCalled();
  });

  it('should remove like when user already liked the comment', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();

    mockCommentRepository.verifyCommentExist = jest.fn()
      .mockResolvedValue();
    mockCommentLikeRepository.isCommentLikedByUser = jest.fn()
      .mockResolvedValue(true);
    mockCommentLikeRepository.addLike = jest.fn()
      .mockResolvedValue();
    mockCommentLikeRepository.removeLike = jest.fn()
      .mockResolvedValue();

    const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
    });

    await toggleLikeCommentUseCase.execute(useCasePayload);

    expect(mockCommentLikeRepository.removeLike)
      .toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentLikeRepository.addLike)
      .not.toBeCalled();
  });
});
