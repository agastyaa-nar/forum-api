const DetailThread = require('../../Domains/threads/entities/DetailThread');
const DetailComment = require('../../Domains/comments/entities/DetailComment');
const DetailReply = require('../../Domains/replies/entities/DetailReply');

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;

    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

    const repliesByCommentId = {};
    replies.forEach((reply) => {
      const detailReply = new DetailReply(reply);

      if (!repliesByCommentId[reply.commentId]) {
        repliesByCommentId[reply.commentId] = [];
      }
      repliesByCommentId[reply.commentId].push(detailReply);
    });

    const detailComments = comments.map((comment) => new DetailComment({
      ...comment, // id, username, date, content, is_delete
      replies: repliesByCommentId[comment.id] || [],
    }));

    return new DetailThread({
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments: detailComments,
    });
  }
}

module.exports = GetThreadDetailUseCase;
