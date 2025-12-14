const NewReply = require('../NewReply');

describe('NewReply entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {}; // no content

    expect(() => new NewReply(payload))
      .toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      content: 123,
    };

    expect(() => new NewReply(payload))
      .toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewReply correctly', () => {
    const payload = {
      content: 'sebuah balasan',
    };

    const newReply = new NewReply(payload);

    expect(newReply.content).toEqual(payload.content);
  });
});
