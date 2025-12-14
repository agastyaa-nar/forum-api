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
        threadId,
        owner: credentialId,
      });

      const response = h.response({
        status: 'success',
        data: {
          addedComment,
        },
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
        threadId,
        commentId,
        owner: credentialId,
      });

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

module.exports = CommentsHandler;
