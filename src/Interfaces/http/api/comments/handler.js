const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');

const DomainErrorTranslator = require('../../../../Commons/exceptions/DomainErrorTranslator');
const ClientError = require('../../../../Commons/exceptions/ClientError');

class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentToThreadHandler = this.postCommentToThreadHandler.bind(this);
    this.deleteCommentFromThreadHandler = this.deleteCommentFromThreadHandler.bind(this);
  }

  async postCommentToThreadHandler(request, h) {
    try {
      const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
      const { id: credentialId } = request.auth.credentials;
      const { threadId } = request.params;
      const { content } = request.payload;

      const addedComment = await addCommentUseCase.execute({
        content,
        owner: credentialId,
        threadId,
      });

      const response = h.response({
        status: 'success',
        data: { addedComment },
      });
      response.code(201);
      return response;
    } catch (error) {
      return this._handleError(error, h);
    }
  }

  async deleteCommentFromThreadHandler(request, h) {
    try {
      const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
      const { id: credentialId } = request.auth.credentials;
      const { threadId, commentId } = request.params;

      await deleteCommentUseCase.execute({
        commentId,
        threadId,
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

module.exports = CommentsHandler;
