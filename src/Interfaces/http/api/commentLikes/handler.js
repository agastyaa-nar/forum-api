const ToggleLikeCommentUseCase = require('../../../../Applications/use_case/ToggleLikeCommentUseCase');

const DomainErrorTranslator = require('../../../../Commons/exceptions/DomainErrorTranslator');
const ClientError = require('../../../../Commons/exceptions/ClientError');

class CommentLikesHandler {
  constructor(container) {
    this._container = container;

    this.putCommentLikeHandler = this.putCommentLikeHandler.bind(this);
  }

  async putCommentLikeHandler(request, h) {
    try {
      const toggleLikeCommentUseCase = this._container.getInstance(ToggleLikeCommentUseCase.name);
      const { id: credentialId } = request.auth.credentials;
      const { threadId, commentId } = request.params;

      await toggleLikeCommentUseCase.execute({
        threadId,
        commentId,
        owner: credentialId,
      });

      return h.response({ status: 'success' }).code(200);
    } catch (error) {
      return this._handleError(error, h);
    }
  }

  _handleError(error, h) {
    const translatedError = DomainErrorTranslator.translate(error);

    if (translatedError instanceof ClientError) {
      return h.response({
        status: 'fail',
        message: translatedError.message,
      }).code(translatedError.statusCode);
    }

    console.error(error);
    return h.response({
      status: 'error',
      message: 'terjadi kesalahan pada server kami',
    }).code(500);
  }
}

module.exports = CommentLikesHandler;
