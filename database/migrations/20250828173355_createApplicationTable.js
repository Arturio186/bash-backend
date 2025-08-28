/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("applications", (table) => {
    table.increments("id").primary();            
    table.string("tg_username").notNullable();
    table.time("time").notNullable();
    table.string("network").notNullable();       
    table.decimal("amount", 14, 2).notNullable().defaultTo(0.00);
    table.integer("type").notNullable();    
    table.string("address").notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("applications");
};
