const DetailComment = require('../DetailComment');
const DetailReply = require('../../../replies/entities/DetailReply');

describe('DetailComment entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      // content missing
      replies: [],
    };

    expect(() => new DetailComment(payload))
      .toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 123,
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah komentar',
      replies: 'bukan array',
    };

    expect(() => new DetailComment(payload))
      .toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailComment object correctly with default likeCount', () => {
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah komentar',
      replies: [],
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.date).toEqual(payload.date);
    expect(detailComment.content).toEqual(payload.content);
    expect(detailComment.likeCount).toEqual(0);
    expect(detailComment.replies).toEqual([]);
  });

  it('should map is_delete to masked content', () => {
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah komentar',
      is_delete: true,
      replies: [],
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.content).toEqual('**komentar telah dihapus**');
  });

  it('should wrap replies into DetailReply instances', () => {
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah komentar',
      replies: [
        {
          id: 'reply-123',
          username: 'john',
          date: '2021-08-08T08:00:00.000Z',
          content: 'sebuah balasan',
          is_delete: false,
        },
      ],
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.replies).toHaveLength(1);
    expect(detailComment.replies[0]).toBeInstanceOf(DetailReply);
  });

  it('should keep likeCount when provided', () => {
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah komentar',
      replies: [],
      likeCount: 5,
    };

    const detailComment = new DetailComment(payload);

    expect(detailComment.likeCount).toEqual(5);
  });
});
