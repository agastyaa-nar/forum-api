const NewReply = require('../../Domains/replies/entities/NewReply');

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, params, owner) {
    const { threadId, commentId } = params;

    // pastikan comment (dan thread) ada
    await this._commentRepository.verifyCommentExist(commentId, threadId);

    const newReply = new NewReply(useCasePayload);

    return this._replyRepository.addReply(newReply, commentId, owner);
  }
}

module.exports = AddReplyUseCase;
