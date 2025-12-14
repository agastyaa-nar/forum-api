class DeleteCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const { threadId, commentId, owner } = useCasePayload;

    // Pastikan thread ada → kalau tidak, NotFoundError
    await this._threadRepository.verifyThreadExist(threadId);

    // Pastikan komentar ada & dimiliki owner → kalau tidak, NotFoundError / AuthorizationError
    await this._commentRepository.verifyCommentOwner(commentId, owner);

    // Soft delete
    await this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
