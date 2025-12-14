const AddReplyUseCase = require('../../../../Applications/use_case/AddReplyUseCase');
const DeleteReplyUseCase = require('../../../../Applications/use_case/DeleteReplyUseCase');

const DomainErrorTranslator = require('../../../../Commons/exceptions/DomainErrorTranslator');
const ClientError = require('../../../../Commons/exceptions/ClientError');

class RepliesHandler {
  constructor(container) {
    this._container = container;

    this.postReplyToCommentHandler = this.postReplyToCommentHandler.bind(this);
    this.deleteReplyFromCommentHandler = this.deleteReplyFromCommentHandler.bind(this);
  }

  // POST /threads/{threadId}/comments/{commentId}/replies
  async postReplyToCommentHandler(request, h) {
    try {
      const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
      const { id: credentialId } = request.auth.credentials;
      const { threadId, commentId } = request.params;
      const { content } = request.payload;

      const addedReply = await addReplyUseCase.execute(
        { content },
        { threadId, commentId },
        credentialId,
      );

      const response = h.response({
        status: 'success',
        data: {
          addedReply,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      return this._handleError(error, h);
    }
  }

  // DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}
  async deleteReplyFromCommentHandler(request, h) {
    try {
      const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
      const { id: credentialId } = request.auth.credentials;
      const { threadId, commentId, replyId } = request.params;

      await deleteReplyUseCase.execute(
        { threadId, commentId, replyId },
        credentialId,
      );

      const response = h.response({
        status: 'success',
      });
      response.code(200);
      return response;
    } catch (error) {
      return this._handleError(error, h);
    }
  }

  _handleError(error, h) {
    const translatedError = DomainErrorTranslator.translate(error);

    if (translatedError instanceof ClientError) {
      const response = h.response({
        status: 'fail',
        message: translatedError.message,
      });
      response.code(translatedError.statusCode);
      return response;
    }

    console.error(error);

    const response = h.response({
      status: 'error',
      message: 'terjadi kesalahan pada server kami',
    });
    response.code(500);
    return response;
  }
}

module.exports = RepliesHandler;
