const DetailReply = require('../DetailReply');

describe('a DetailReply entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T07:22:33.555Z',
      // username hilang
      is_delete: false,
    };

    // Action & Assert
    expect(() => new DetailReply(payload))
      .toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123,
      content: 'sebuah balasan',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      is_delete: 'false',
    };

    // Action & Assert
    expect(() => new DetailReply(payload))
      .toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when is_delete is not boolean', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      is_delete: 'false', // string instead of boolean
    };

    // Action & Assert
    expect(() => new DetailReply(payload))
      .toThrowError('DETAIL_REPLY.IS_DELETE_NOT_BOOLEAN');
  });

  it('should create DetailReply object correctly when is_delete = false', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      is_delete: false,
    };

    // Action
    const detailReply = new DetailReply(payload);

    // Assert
    expect(detailReply.id).toEqual(payload.id);
    expect(detailReply.username).toEqual(payload.username);
    expect(detailReply.date).toEqual(payload.date);
    expect(detailReply.content).toEqual(payload.content);
  });

  it('should create DetailReply object correctly with masked content when is_delete = true', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      content: 'sebuah balasan',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      is_delete: true,
    };

    // Action
    const detailReply = new DetailReply(payload);

    // Assert
    expect(detailReply.id).toEqual(payload.id);
    expect(detailReply.username).toEqual(payload.username);
    expect(detailReply.date).toEqual(payload.date);
    expect(detailReply.content).toEqual('**balasan telah dihapus**');
  });
});
