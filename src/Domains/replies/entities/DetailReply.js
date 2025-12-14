class DetailReply {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, username, date, content, is_delete = false,
    } = payload;

    this.id = id;
    this.username = username;
    this.date = date;
    this.content = is_delete ? '**balasan telah dihapus**' : content;
  }

  _verifyPayload({
    id, username, date, content, is_delete,
  }) {
    if (!id || !username || !date || !content) {
      throw new Error('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof date !== 'string'
      || typeof content !== 'string'
    ) {
      throw new Error('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }

    if (is_delete !== undefined && typeof is_delete !== 'boolean') {
      throw new Error('DETAIL_REPLY.IS_DELETE_NOT_BOOLEAN');
    }
  }
}

module.exports = DetailReply;
