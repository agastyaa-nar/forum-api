const DetailReply = require('../../replies/entities/DetailReply');

class DetailComment {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id,
      username,
      date,
      content,
      is_delete = false,
      replies,
      likeCount = 0,
    } = payload;

    this.id = id;
    this.username = username;
    this.date = date;
    this.content = is_delete ? '**komentar telah dihapus**' : content;
    this.likeCount = likeCount;
    this.replies = replies.map((reply) => (
      reply instanceof DetailReply ? reply : new DetailReply(reply)
    ));
  }

  _verifyPayload({
    id, username, date, content, replies, likeCount,
  }) {
    if (!id || !username || !date || !content || !replies) {
      throw new Error('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof date !== 'string'
      || typeof content !== 'string'
      || !Array.isArray(replies)
      || (typeof likeCount !== 'undefined' && typeof likeCount !== 'number')
    ) {
      throw new Error('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailComment;
