// src/Infrastructures/http/_test/threads.test.js

const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');
const container = require('../../container');

const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');

describe('/threads endpoints', () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
  });

  beforeEach(async () => {
    // Bersihkan semua tabel sebelum setiap test
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    // Bersihkan dalam urutan yang benar (child dulu, baru parent)
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * Helper untuk register + login dan ngambil accessToken
   */
  const registerAndLogin = async (username = 'dicoding') => {
    const password = 'secret';

    // register
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username,
        password,
        fullname: 'Dicoding Indonesia',
      },
    });

    // login
    const response = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username,
        password,
      },
    });

    const responseJson = JSON.parse(response.payload);

    // Debug: log jika response tidak sesuai
    if (!responseJson.data || !responseJson.data.accessToken) {
      console.error('Login failed:', responseJson);
      throw new Error(`Login failed for user ${username}: ${JSON.stringify(responseJson)}`);
    }

    return responseJson.data.accessToken;
  };

  // ======================
  // POST /threads
  // ======================

  describe('POST /threads', () => {
    it('should respond 401 when no authentication provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should respond 400 when payload does not contain needed property', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          // title hilang
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 400 when payload type is invalid', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 123, // seharusnya string
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 201 and persist thread when payload is valid', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread.id).toBeDefined();
      expect(responseJson.data.addedThread.title).toEqual('sebuah thread');
      expect(responseJson.data.addedThread.owner).toBeDefined();
    });

    it('should respond 500 when server error occurs', async () => {
      const accessToken = await registerAndLogin();

      // Mock container to throw error
      const mockContainer = {
        getInstance: jest.fn(() => {
          throw new Error('Unexpected server error');
        }),
      };
      const testServer = await createServer(mockContainer);

      const response = await testServer.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(500);
      expect(responseJson.status).toEqual('error');
    });
  });

  // ======================
  // POST /threads/{threadId}/comments
  // ======================

  describe('POST /threads/{threadId}/comments', () => {
    it('should respond 401 when no authentication provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: {
          content: 'sebuah comment',
        },
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should respond 404 when thread not found', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments',
        payload: {
          content: 'sebuah comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 400 when payload does not contain needed property', async () => {
      const accessToken = await registerAndLogin();

      // buat thread dulu
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread tanpa content',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // kirim comment payload salah
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          // content hilang
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 201 and persist comment when payload is valid', async () => {
      const accessToken = await registerAndLogin();

      // buat thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'sebuah comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment.id).toBeDefined();
      expect(responseJson.data.addedComment.content).toEqual('sebuah comment');
      expect(responseJson.data.addedComment.owner).toBeDefined();
    });

    it('should respond 500 when server error occurs', async () => {
      const accessToken = await registerAndLogin();

      const mockContainer = {
        getInstance: jest.fn(() => {
          throw new Error('Unexpected server error');
        }),
      };
      const testServer = await createServer(mockContainer);

      const response = await testServer.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: {
          content: 'sebuah comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(500);
      expect(responseJson.status).toEqual('error');
    });
  });

  // ======================
  // POST /threads/{threadId}/comments/{commentId}/replies
  // ======================

  describe('POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should respond 401 when no authentication provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments/comment-123/replies',
        payload: {
          content: 'sebuah balasan',
        },
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should respond 404 when thread or comment not found', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments/comment-xxx/replies',
        payload: {
          content: 'sebuah balasan',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 400 when payload does not contain needed property', async () => {
      const accessToken = await registerAndLogin();

      // buat thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread dengan comment',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // buat comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'sebuah comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentJson = JSON.parse(commentResponse.payload);
      const commentId = commentJson.data.addedComment.id;

      // kirim reply tanpa content
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          // content hilang
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 201 and persist reply when payload is valid', async () => {
      const accessToken = await registerAndLogin();

      // buat thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread dengan reply',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // buat comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'sebuah comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentJson = JSON.parse(commentResponse.payload);
      const commentId = commentJson.data.addedComment.id;

      // buat reply
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'sebuah balasan',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedReply).toBeDefined();
      expect(responseJson.data.addedReply.id).toBeDefined();
      expect(responseJson.data.addedReply.content).toEqual('sebuah balasan');
      expect(responseJson.data.addedReply.owner).toBeDefined();
    });

    it('should respond 500 when server error occurs', async () => {
      const accessToken = await registerAndLogin();

      const mockContainer = {
        getInstance: jest.fn(() => {
          throw new Error('Unexpected server error');
        }),
      };
      const testServer = await createServer(mockContainer);

      const response = await testServer.inject({
        method: 'POST',
        url: '/threads/thread-123/comments/comment-123/replies',
        payload: {
          content: 'sebuah balasan',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(500);
      expect(responseJson.status).toEqual('error');
    });
  });


  // ======================
  // DELETE /threads/{threadId}/comments/{commentId}
  // ======================

  describe('DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should respond 401 when no authentication provided', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123',
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should respond 404 when thread does not exist', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-xxx',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 403 when not comment owner', async () => {
      const ownerToken = await registerAndLogin('owner');
      const otherToken = await registerAndLogin('other');

      // thread oleh owner
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread owner',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // comment oleh owner
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'comment owner',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const commentJson = JSON.parse(commentResponse.payload);
      const commentId = commentJson.data.addedComment.id;

      // coba delete pakai other
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 200 when owner deletes comment', async () => {
      const accessToken = await registerAndLogin('owner-thread');

      // thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread delete',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'comment to delete',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentJson = JSON.parse(commentResponse.payload);
      const commentId = commentJson.data.addedComment.id;

      // delete
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should respond 500 when server error occurs', async () => {
      const accessToken = await registerAndLogin();

      const mockContainer = {
        getInstance: jest.fn(() => {
          throw new Error('Unexpected server error');
        }),
      };
      const testServer = await createServer(mockContainer);

      const response = await testServer.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(500);
      expect(responseJson.status).toEqual('error');
    });
  });

  // ======================
  // DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}
  // ======================

  describe('DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should respond 401 when no authentication provided', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123/replies/reply-123',
      });

      expect(response.statusCode).toEqual(401);
    });

    it('should respond 404 when thread or comment or reply not found', async () => {
      const accessToken = await registerAndLogin();

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-xxx/replies/reply-xxx',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 403 when not reply owner', async () => {
      const ownerToken = await registerAndLogin('owner-reply');
      const otherToken = await registerAndLogin('other-reply');

      // thread oleh owner
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread owner',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // comment oleh owner
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'comment owner',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const commentJson = JSON.parse(commentResponse.payload);
      const commentId = commentJson.data.addedComment.id;

      // reply oleh owner
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'reply owner',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      const replyJson = JSON.parse(replyResponse.payload);
      const replyId = replyJson.data.addedReply.id;

      // delete pakai other
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${otherToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 200 when owner deletes reply', async () => {
      const accessToken = await registerAndLogin('owner-reply-2');

      // thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread delete reply',
          body: 'body',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'comment with reply',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentJson = JSON.parse(commentResponse.payload);
      const commentId = commentJson.data.addedComment.id;

      // reply
      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'reply to delete',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const replyJson = JSON.parse(replyResponse.payload);
      const replyId = replyJson.data.addedReply.id;

      // delete reply
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should respond 500 when server error occurs', async () => {
      const accessToken = await registerAndLogin();

      const mockContainer = {
        getInstance: jest.fn(() => {
          throw new Error('Unexpected server error');
        }),
      };
      const testServer = await createServer(mockContainer);

      const response = await testServer.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123/replies/reply-123',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(500);
      expect(responseJson.status).toEqual('error');
    });
  });


  // ======================
  // GET /threads/{threadId}
  // ======================

  describe('GET /threads/{threadId}', () => {
    it('should respond 404 when thread not found', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/threads/thread-xxx',
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should respond 200 and return thread detail with comments, including soft deleted comment', async () => {
      const accessToken = await registerAndLogin();

      // thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'sebuah thread',
          body: 'sebuah body thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const threadJson = JSON.parse(threadResponse.payload);
      const threadId = threadJson.data.addedThread.id;

      // comment 1 (akan dihapus)
      const commentResponse1 = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'comment 1',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentJson1 = JSON.parse(commentResponse1.payload);
      const commentId1 = commentJson1.data.addedComment.id;

      // comment 2 (tetap)
      await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'comment 2',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // soft delete comment 1
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId1}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // get detail thread
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      const thread = responseJson.data.thread;

      expect(thread.id).toEqual(threadId);
      expect(thread.title).toEqual('sebuah thread');
      expect(thread.body).toEqual('sebuah body thread');
      expect(thread.username).toBeDefined();
      expect(Array.isArray(thread.comments)).toBe(true);
      expect(thread.comments).toHaveLength(2);

      const [firstComment, secondComment] = thread.comments;

      expect(firstComment.id).toBeDefined();
      expect(firstComment.username).toBeDefined();
      expect(firstComment.date).toBeDefined();
      expect(typeof firstComment.content).toBe('string');

      // salah satu komentar harus sudah jadi "**komentar telah dihapus**"
      const deletedComments = thread.comments.filter(
        (c) => c.content === '**komentar telah dihapus**',
      );
      expect(deletedComments.length).toBe(1);
    });

    it('should respond 500 when server error occurs', async () => {
      const mockContainer = {
        getInstance: jest.fn(() => {
          throw new Error('Unexpected server error');
        }),
      };
      const testServer = await createServer(mockContainer);

      const response = await testServer.inject({
        method: 'GET',
        url: '/threads/thread-123',
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(500);
      expect(responseJson.status).toEqual('error');
    });
  });
});
