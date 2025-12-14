const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
const GetThreadDetailUseCase = require('../../../../Applications/use_case/GetThreadDetailUseCase');

const DomainErrorTranslator = require('../../../../Commons/exceptions/DomainErrorTranslator');
const ClientError = require('../../../../Commons/exceptions/ClientError');

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.getThreadByIdHandler = this.getThreadByIdHandler.bind(this);
  }

  async postThreadHandler(request, h) {
    try {
      const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
      const { id: credentialId } = request.auth.credentials;

      const addedThread = await addThreadUseCase.execute({
        title: request.payload.title,
        body: request.payload.body,
        owner: credentialId,
      });

      const response = h.response({
        status: 'success',
        data: {
          addedThread,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      return this._handleError(error, h);
    }
  }

  async getThreadByIdHandler(request, h) {
    try {
      const getThreadDetailUseCase = this._container.getInstance(GetThreadDetailUseCase.name);
      const { threadId } = request.params;

      const thread = await getThreadDetailUseCase.execute({ threadId });

      const response = h.response({
        status: 'success',
        data: {
          thread,
        },
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

module.exports = ThreadsHandler;
