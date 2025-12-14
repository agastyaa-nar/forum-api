const AddReplyUseCase = require('../AddReplyUseCase');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const NewReply = require('../../../Domains/replies/entities/NewReply');

describe('AddReplyUseCase', () => {
  it('should orchestrate add reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'sebuah balasan',
    };
    const params = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };
    const owner = 'user-123';

    const expectedAddedReply = new AddedReply({
      id: 'reply-123',
      content: useCasePayload.content,
      owner,
    });

    /** creating dependency of use case */
    const mockReplyRepository = new ReplyRepository();
    const mockCommentRepository = new CommentRepository();

    // mocking needed fn
    mockCommentRepository.verifyCommentExist = jest.fn()
      .mockResolvedValue();

    mockReplyRepository.addReply = jest.fn()
      .mockResolvedValue(expectedAddedReply);

    /** creating use case instance */
    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const addedReply = await addReplyUseCase.execute(useCasePayload, params, owner);

    // Assert
    expect(mockCommentRepository.verifyCommentExist)
      .toBeCalledWith(params.commentId, params.threadId);

    expect(mockReplyRepository.addReply)
      .toBeCalledWith(new NewReply(useCasePayload), params.commentId, owner);

    expect(addedReply).toStrictEqual(expectedAddedReply);
  });
});
