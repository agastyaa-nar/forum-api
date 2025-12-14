const DeleteReplyUseCase = require('../DeleteReplyUseCase');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');

describe('DeleteReplyUseCase', () => {
  it('should orchestrate delete reply action correctly', async () => {
    // Arrange
    const params = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
    };
    const owner = 'user-123';

    const mockReplyRepository = new ReplyRepository();
    const mockCommentRepository = new CommentRepository();

    mockCommentRepository.verifyCommentExist = jest.fn()
      .mockResolvedValue();
    mockReplyRepository.verifyReplyOwner = jest.fn()
      .mockResolvedValue();
    mockReplyRepository.deleteReply = jest.fn()
      .mockResolvedValue();

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await deleteReplyUseCase.execute(params, owner);

    // Assert
    expect(mockCommentRepository.verifyCommentExist)
      .toBeCalledWith(params.commentId, params.threadId);

    expect(mockReplyRepository.verifyReplyOwner)
      .toBeCalledWith(params.replyId, owner);

    expect(mockReplyRepository.deleteReply)
      .toBeCalledWith(params.replyId);
  });
});
