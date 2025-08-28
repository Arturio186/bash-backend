exports.up = function(knex) {
  return knex.schema.createTable('usdtRate', function(table) {
    table.increments('id').primary();
    table.decimal('sell', 12, 2).notNullable();
    table.decimal('base', 12, 2).notNullable();
    table.decimal('buy', 12, 2).notNullable();
    table.decimal('change', 12, 2).notNullable();
    table.timestamp('fetchedAt').defaultTo(knex.fn.now()).notNullable();
    
    table.boolean('single_row').defaultTo(true).notNullable();
    table.unique(['single_row'], { indexName: 'usdt_rate_single_row_unique' });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('usdtRate');
};