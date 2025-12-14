class ToggleLikeCommentUseCase {
  constructor({ commentLikeRepository, commentRepository }) {
    this._commentLikeRepository = commentLikeRepository;
    this._commentRepository = commentRepository;
  }

  async execute(params) {
    const { threadId, commentId, owner } = params;

    // pastikan comment & thread ada
    await this._commentRepository.verifyCommentExist(commentId, threadId);

    // cek sudah like atau belum
    const isLiked = await this._commentLikeRepository.isCommentLikedByUser(commentId, owner);

    if (isLiked) {
      // sudah like -> batal like
      await this._commentLikeRepository.removeLike(commentId, owner);
    } else {
      // belum like -> like baru
      await this._commentLikeRepository.addLike(commentId, owner);
    }
  }
}

module.exports = ToggleLikeCommentUseCase;
