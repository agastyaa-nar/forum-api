/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: {
      type: 'TEXT',
      notNull: true,
    },
  });

  // relasi ke users
  pgm.addConstraint(
    'comment_likes',
    'fk_comment_likes.owner_users.id',
    'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE',
  );

  // relasi ke comments
  pgm.addConstraint(
    'comment_likes',
    'fk_comment_likes.comment_id_comments.id',
    'FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE',
  );

  // satu user hanya boleh like satu kali per comment
  pgm.addConstraint(
    'comment_likes',
    'unique_comment_likes.owner_comment_id',
    'UNIQUE(owner, comment_id)',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('comment_likes');
};
